import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';
import Chat from '../models/Chat';
import User from '../models/User';

const getJwtSecret = () => process.env.JWT_SECRET || 'everchat_jwt_secret_key_2026_super_secure';

interface SocketUser {
  userId: string;
  email: string;
}

export const onlineUsers = new Map<string, string>(); // userId -> socketId

export const setupSocketIO = (io: Server) => {
  // Socket.io middleware for JWT authentication handshake
  io.use((socket: Socket & { user?: SocketUser }, next: (err?: any) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    jwt.verify(token, getJwtSecret(), (err: any, decoded: any) => {
      if (err) {
        return next(new Error('Unauthorized'));
      }
      socket.user = decoded as SocketUser;
      next();
    });
  });

  io.on('connection', async (socket: Socket & { user?: SocketUser }) => {
    const userId = socket.user?.userId;
    if (!userId) return;

    onlineUsers.set(userId, socket.id);
    console.log(`[Socket.io] User connected: ${userId} (Socket ID: ${socket.id})`);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit('user_online', { userId });

    // Join Chat Room handler with participant verification against MongoDB
    socket.on('join_chat', async (chatId: string) => {
      try {
        if (!chatId) return;

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          (p: any) => p.toString() === userId
        );

        if (!isParticipant) {
          console.warn(`[Socket.io] Security violation: User ${userId} tried to join unauthorized room ${chatId}`);
          socket.emit('error', { message: 'Unauthorized room access' });
          return;
        }

        socket.join(chatId);
        console.log(`[Socket.io] User ${userId} joined room ${chatId}`);
      } catch (error) {
        console.error('[Socket.io] Error in join_chat:', error);
      }
    });

    socket.on('send_message', async (data: { chatId: string; text?: string; type?: string; mediaUrl?: string; duration?: number; replyTo?: string }) => {
      try {
        const { chatId, text, type, mediaUrl, duration, replyTo } = data;

        // Verify participant membership in DB before saving message
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isParticipant = chat.participants.some(
          (p: any) => p.toString() === userId
        );
        if (!isParticipant) return;

        // In direct chat, verify blocked status
        if (chat.type === 'direct') {
          const recipientId = chat.participants.find((p: any) => p.toString() !== userId);
          if (recipientId) {
            const sender = await User.findById(userId);
            const recipient = await User.findById(recipientId);
            if (
              sender?.blockedUsers.includes(recipientId as any) ||
              recipient?.blockedUsers.includes(userId as any)
            ) {
              socket.emit('error', { message: 'Message blocked' });
              return;
            }
          }
        }

        const message = new Message({
          chatId,
          senderId: userId,
          type: type || 'text',
          text: text || '',
          mediaUrl: mediaUrl || '',
          duration: duration || undefined,
          replyTo: replyTo || null,
          status: 'sent',
        });


        await message.save();
        await message.populate('senderId', '_id name avatarUrl');
        if (replyTo) {
          await message.populate('replyTo');
        }

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: {
            text: type === 'text' ? text : `[${type}]`,
            senderId: userId,
            type: type || 'text',
            createdAt: new Date(),
          },
        });

        io.to(chatId).emit('receive_message', message);
      } catch (error) {
        console.error('[Socket.io] Error in send_message:', error);
      }
    });

    socket.on('typing_start', async (data: { chatId: string }) => {
      if (!data?.chatId) return;
      if (socket.rooms.has(data.chatId)) {
        socket.to(data.chatId).emit('typing_start', { chatId: data.chatId, userId });
      }
    });

    socket.on('typing_stop', async (data: { chatId: string }) => {
      if (!data?.chatId) return;
      if (socket.rooms.has(data.chatId)) {
        socket.to(data.chatId).emit('typing_stop', { chatId: data.chatId, userId });
      }
    });

    socket.on('message_delivered', async (data: { messageId: string; chatId: string }) => {
      if (!data?.messageId || !data?.chatId) return;
      await Message.findByIdAndUpdate(data.messageId, { status: 'delivered' });
      io.to(data.chatId).emit('message_status_update', { messageId: data.messageId, status: 'delivered' });
    });

    socket.on('message_read', async (data: { messageId: string; chatId: string }) => {
      if (!data?.messageId || !data?.chatId) return;
      await Message.findByIdAndUpdate(data.messageId, { status: 'read' });
      io.to(data.chatId).emit('message_status_update', { messageId: data.messageId, status: 'read' });
    });

    socket.on('reaction_add', async (data: { messageId: string; chatId: string; emoji: string }) => {
      try {
        if (!data?.messageId || !data?.chatId || !data?.emoji) return;

        const chat = await Chat.findById(data.chatId);
        if (!chat || !chat.participants.some((p: any) => p.toString() === userId)) return;

        const message = await Message.findById(data.messageId);
        if (message) {
          const existingIndex = message.reactions.findIndex(
            (r: any) => r.userId.toString() === userId
          );

          if (existingIndex > -1) {
            message.reactions[existingIndex].emoji = data.emoji;
          } else {
            message.reactions.push({ userId: userId as any, emoji: data.emoji });
          }

          await message.save();
          io.to(data.chatId).emit('reaction_updated', {
            messageId: data.messageId,
            chatId: data.chatId,
            reactions: message.reactions,
          });
        }
      } catch (error) {
        console.error('[Socket.io] Error in reaction_add:', error);
      }
    });

    socket.on('reaction_remove', async (data: { messageId: string; chatId: string }) => {
      try {
        if (!data?.messageId || !data?.chatId) return;

        const chat = await Chat.findById(data.chatId);
        if (!chat || !chat.participants.some((p: any) => p.toString() === userId)) return;

        const message = await Message.findById(data.messageId);
        if (message) {
          message.reactions = message.reactions.filter(
            (r: any) => r.userId.toString() !== userId
          );
          await message.save();
          io.to(data.chatId).emit('reaction_updated', {
            messageId: data.messageId,
            chatId: data.chatId,
            reactions: message.reactions,
          });
        }
      } catch (error) {
        console.error('[Socket.io] Error in reaction_remove:', error);
      }
    });

    socket.on('reaction_added', async (data: { messageId: string; chatId: string; emoji: string }) => {
      try {
        if (!data?.messageId || !data?.chatId || !data?.emoji) return;

        const message = await Message.findById(data.messageId);
        if (message) {
          const existingReactionIndex = message.reactions.findIndex(
            (r: any) => r.userId.toString() === userId
          );

          if (existingReactionIndex > -1) {
            message.reactions[existingReactionIndex].emoji = data.emoji;
          } else {
            message.reactions.push({ userId: userId as any, emoji: data.emoji });
          }

          await message.save();
          io.to(data.chatId).emit('reaction_updated', {
            messageId: data.messageId,
            chatId: data.chatId,
            reactions: message.reactions,
          });
        }
      } catch (error) {
        console.error('[Socket.io] Error in reaction_added:', error);
      }
    });


    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      console.log(`[Socket.io] User disconnected: ${userId}`);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user_offline', { userId, lastSeen: new Date() });
    });
  });
};
