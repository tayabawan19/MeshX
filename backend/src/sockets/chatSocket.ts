import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';
import Chat from '../models/Chat';
import User from '../models/User';
import Call from '../models/Call';
import { sendPushNotification } from '../services/notificationService';

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

        let expiresAtDate: Date | undefined;
        if (chat.disappearingDuration) {
          expiresAtDate = new Date(Date.now() + chat.disappearingDuration * 1000);
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
          expiresAt: expiresAtDate,
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

        // FCM Push Notification Trigger for offline / backgrounded recipients (suppressed if muted)
        const senderUser = await User.findById(userId);
        const senderName = senderUser?.name || 'Someone';

        let previewText = text || '';
        if (type === 'image') previewText = '📷 Photo';
        else if (type === 'voice') previewText = '🎤 Voice message';
        else if (type === 'document') previewText = '📄 Document';
        else if (previewText.length > 50) previewText = previewText.slice(0, 50) + '...';

        const recipients = chat.participants.filter((p: any) => p.toString() !== userId);
        for (const recipientId of recipients) {
          const rIdStr = recipientId.toString();
          const isMuted = chat.mutedBy?.some((mId: any) => mId.toString() === rIdStr);
          const isRecipientOnline = onlineUsers.has(rIdStr);

          if (!isRecipientOnline && !isMuted) {
            const recUser = await User.findById(rIdStr);
            if (recUser?.fcmToken) {
              await sendPushNotification(recUser.fcmToken, senderName, previewText, {
                chatId,
                type: 'message',
              });
            }
          }
        }

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

    // Call Signaling Event Handlers
    socket.on('call_initiate', async (data: { receiverId: string; type: 'voice' | 'video' }) => {
      try {
        const { receiverId, type } = data;
        if (!receiverId) return;

        const channelName = `call_${userId}_${receiverId}_${Date.now()}`;
        const caller = await User.findById(userId);
        const receiver = await User.findById(receiverId);

        if (!caller || !receiver) return;

        const call = new Call({
          callerId: userId,
          receiverId,
          type: type || 'voice',
          status: 'ongoing',
          channelName,
        });

        await call.save();

        const receiverSocketId = onlineUsers.get(receiverId);
        const payload = {
          callId: call._id.toString(),
          callerId: userId,
          callerName: caller.name,
          callerAvatar: caller.avatarUrl,
          channelName,
          type: type || 'voice',
        };

        if (receiverSocketId) {
          io.to(receiverSocketId).emit('incoming_call', payload);
          console.log(`[Call Signaling] Incoming call emitted to online user ${receiverId}`);
        } else if (receiver.fcmToken) {
          await sendPushNotification(
            receiver.fcmToken,
            `Incoming ${type} call`,
            `${caller.name} is calling you...`,
            {
              callId: call._id.toString(),
              type: 'call',
              channelName,
            }
          );
        }
      } catch (error) {
        console.error('[Call Signaling Error] call_initiate:', error);
      }
    });

    socket.on('call_accept', async (data: { callId: string }) => {
      try {
        const { callId } = data;
        const call = await Call.findById(callId);
        if (!call) return;

        const callerSocketId = onlineUsers.get(call.callerId.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit('call_accepted', { callId });
        }
      } catch (error) {
        console.error('[Call Signaling Error] call_accept:', error);
      }
    });

    socket.on('call_decline', async (data: { callId: string }) => {
      try {
        const { callId } = data;
        const call = await Call.findByIdAndUpdate(callId, { status: 'declined' }, { new: true });
        if (!call) return;

        const callerSocketId = onlineUsers.get(call.callerId.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit('call_declined', { callId });
        }
      } catch (error) {
        console.error('[Call Signaling Error] call_decline:', error);
      }
    });

    socket.on('call_end', async (data: { callId: string; duration?: number }) => {
      try {
        const { callId, duration } = data;
        const call = await Call.findByIdAndUpdate(
          callId,
          { status: 'completed', duration: duration || 0 },
          { new: true }
        );
        if (!call) return;

        const otherUserId = call.callerId.toString() === userId ? call.receiverId.toString() : call.callerId.toString();
        const otherSocketId = onlineUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('call_ended', { callId, duration: duration || 0 });
        }
      } catch (error) {
        console.error('[Call Signaling Error] call_end:', error);
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
