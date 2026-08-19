import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
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

let ioInstance: Server | null = null;
export const getIO = (): Server | null => ioInstance;

export const onlineUsers = new Map<string, string>(); // userId -> socketId
export const activeUserCalls = new Map<string, string>(); // userId -> callId

export const setupSocketIO = (io: Server) => {
  ioInstance = io;
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
    socket.join(userId);
    socket.join(`user_${userId}`);
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

    socket.on('send_message', async (data: {
      chatId: string;
      text?: string;
      type?: string;
      mediaUrl?: string;
      duration?: number;
      replyTo?: string;
      storyReply?: any;
      isForwarded?: boolean;
      forwardCount?: number;
    }) => {
      try {
        const { chatId, text, type, mediaUrl, duration, replyTo, storyReply, isForwarded, forwardCount } = data;

        // Verify participant membership in DB before saving message
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isParticipant = chat.participants.some(
          (p: any) => p.toString() === userId
        );
        if (!isParticipant) return;

        // Check group permission: only admins can message
        if (chat.type === 'group' && chat.onlyAdminsCanMessage) {
          const isAdmin = chat.admins?.some((a: any) => a.toString() === userId);
          if (!isAdmin) {
            socket.emit('error', { message: 'Only admins can send messages in this group.' });
            return;
          }
        }

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

        const validReplyTo = replyTo && mongoose.Types.ObjectId.isValid(replyTo) ? replyTo : null;

        const validStoryReply =
          storyReply && (storyReply.storyId || storyReply.mediaUrl || storyReply.caption)
            ? storyReply
            : undefined;

        const message = new Message({
          chatId,
          senderId: userId,
          type: type || 'text',
          text: text || '',
          mediaUrl: mediaUrl || '',
          duration: duration || undefined,
          replyTo: validReplyTo,
          storyReply: validStoryReply,
          isForwarded: !!isForwarded,
          forwardCount: forwardCount || (isForwarded ? 1 : 0),
          status: 'sent',
          expiresAt: expiresAtDate,
        });

        await message.save();
        await message.populate('senderId', '_id name avatarUrl');
        if (validReplyTo) {
          await message.populate('replyTo');
        }

        const recipients = chat.participants.filter((p: any) => p.toString() !== userId);
        const incUpdates: Record<string, number> = {};
        recipients.forEach((p: any) => {
          incUpdates[`unreadCounts.${p.toString()}`] = 1;
        });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: {
            text: type === 'text' ? text : `[${type}]`,
            senderId: userId,
            type: type || 'text',
            createdAt: new Date(),
          },
          ...(Object.keys(incUpdates).length > 0 ? { $inc: incUpdates } : {}),
        });

        io.to(chatId).emit('receive_message', message);

        // Also deliver to recipients who are online but currently not in room chatId
        recipients.forEach((r: any) => {
          const rIdStr = r.toString();
          const rSocketId = onlineUsers.get(rIdStr);
          if (rSocketId && !io.sockets.adapter.rooms.get(chatId)?.has(rSocketId)) {
            io.to(rSocketId).emit('receive_message', message);
          }
        });

        // FCM Push Notification Trigger for offline / backgrounded recipients
        const senderUser = await User.findById(userId);
        const senderName = senderUser?.name || 'Someone';

        let previewText = text || '';
        if (type === 'image') previewText = '📷 Photo';
        else if (type === 'voice') previewText = '🎤 Voice message';
        else if (type === 'document') previewText = '📄 Document';
        else if (previewText.length > 50) previewText = previewText.slice(0, 50) + '...';

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

    // Delete message for everyone (1 hour limit)
    socket.on('delete_message_everyone', async (data: { messageId: string; chatId: string }) => {
      try {
        const { messageId, chatId } = data;
        if (!mongoose.Types.ObjectId.isValid(messageId)) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        if (message.senderId.toString() !== userId) {
          socket.emit('error', { message: 'You can only delete your own messages for everyone.' });
          return;
        }

        const oneHourMs = 60 * 60 * 1000;
        if (Date.now() - new Date(message.createdAt).getTime() > oneHourMs) {
          socket.emit('error', { message: 'Messages can only be deleted for everyone within 1 hour of sending.' });
          return;
        }

        message.isDeletedForEveryone = true;
        message.text = 'This message was deleted';
        message.mediaUrl = '';
        message.type = 'text';
        await message.save();

        io.to(chatId).emit('message_deleted_everyone', { messageId, chatId });
      } catch (error) {
        console.error('[Socket.io] Error in delete_message_everyone:', error);
      }
    });

    // Edit sent message (15 minute limit)
    socket.on('edit_message', async (data: { messageId: string; chatId: string; text: string }) => {
      try {
        const { messageId, chatId, text } = data;
        if (!mongoose.Types.ObjectId.isValid(messageId) || !text?.trim()) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        if (message.senderId.toString() !== userId) {
          socket.emit('error', { message: 'You can only edit your own messages.' });
          return;
        }

        if (message.isDeletedForEveryone) {
          socket.emit('error', { message: 'Cannot edit a deleted message.' });
          return;
        }

        const fifteenMinsMs = 15 * 60 * 1000;
        if (Date.now() - new Date(message.createdAt).getTime() > fifteenMinsMs) {
          socket.emit('error', { message: 'Messages can only be edited within 15 minutes of sending.' });
          return;
        }

        message.text = text.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(chatId).emit('message_edited', {
          messageId,
          chatId,
          text: message.text,
          isEdited: true,
          editedAt: message.editedAt,
        });
      } catch (error) {
        console.error('[Socket.io] Error in edit_message:', error);
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
      if (!mongoose.Types.ObjectId.isValid(data.messageId)) return;
      await Message.findByIdAndUpdate(data.messageId, {
        status: 'delivered',
        $addToSet: { deliveredTo: { userId: userId as any, deliveredAt: new Date() } },
      });
      io.to(data.chatId).emit('message_status_update', { messageId: data.messageId, status: 'delivered', userId });
    });

    socket.on('message_read', async (data: { messageId: string; chatId: string }) => {
      if (!data?.messageId || !data?.chatId) return;
      if (!mongoose.Types.ObjectId.isValid(data.messageId)) return;
      await Message.findByIdAndUpdate(data.messageId, {
        status: 'read',
        $addToSet: { readBy: { userId: userId as any, readAt: new Date() } },
      });
      if (mongoose.Types.ObjectId.isValid(data.chatId)) {
        await Chat.findByIdAndUpdate(data.chatId, {
          $set: { [`unreadCounts.${userId}`]: 0 },
        });
      }
      io.to(data.chatId).emit('message_status_update', { messageId: data.messageId, status: 'read', userId });
    });

    socket.on('mark_chat_read', async (data: { chatId: string }) => {
      try {
        if (!data?.chatId || !mongoose.Types.ObjectId.isValid(data.chatId)) return;
        await Chat.findByIdAndUpdate(data.chatId, {
          $set: { [`unreadCounts.${userId}`]: 0 },
        });
        await Message.updateMany(
          { chatId: data.chatId, senderId: { $ne: userId }, status: { $ne: 'read' } },
          {
            $set: { status: 'read' },
            $addToSet: { readBy: { userId: userId as any, readAt: new Date() } },
          }
        );
        io.to(data.chatId).emit('chat_read', { chatId: data.chatId, userId });
      } catch (error) {
        console.error('[Socket.io] Error in mark_chat_read:', error);
      }
    });

    socket.on('reaction_add', async (data: { messageId: string; chatId: string; emoji: string }) => {
      try {
        if (!data?.messageId || !data?.chatId || !data?.emoji) return;
        if (!mongoose.Types.ObjectId.isValid(data.messageId)) return;

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
        if (!mongoose.Types.ObjectId.isValid(data.messageId)) return;

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

        // Check if receiver is already in an ongoing call (Busy state parity)
        if (activeUserCalls.has(receiverId)) {
          console.log(`[Call Signaling] Receiver ${receiverId} is busy on call ${activeUserCalls.get(receiverId)}`);
          socket.emit('call_busy', { receiverId, reason: 'User is busy on another call' });

          const busyCall = new Call({
            callerId: userId,
            receiverId,
            type: type || 'voice',
            status: 'missed',
            channelName: `busy_${Date.now()}`,
          });
          await busyCall.save();
          return;
        }

        const sortedIds = [userId, receiverId].sort();
        const channelName = `call_${sortedIds[0]}_${sortedIds[1]}_${Date.now()}`;
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
        const callIdStr = call._id.toString();
        activeUserCalls.set(userId, callIdStr);

        console.log(`[Call Signaling] [INITIATE] Caller: ${userId} (${caller.name}) -> Receiver: ${receiverId} (${receiver.name}), CallId: ${callIdStr}, Channel: ${channelName}, Type: ${type}`);

        // Acknowledge call creation to caller
        socket.emit('call_initiated', {
          callId: callIdStr,
          channelName,
          type: type || 'voice',
        });

        const receiverSocketId = onlineUsers.get(receiverId);
        const payload = {
          callId: callIdStr,
          callerId: userId,
          callerName: caller.name,
          callerAvatar: caller.avatarUrl,
          channelName,
          type: type || 'voice',
        };

        if (receiverSocketId) {
          io.to(receiverSocketId).emit('incoming_call', payload);
          console.log(`[Call Signaling] [INCOMING_EMITTED] Emitted incoming_call to receiver socket ${receiverSocketId}`);
        } else {
          console.log(`[Call Signaling] Receiver ${receiverId} offline. Attempting push notification...`);
          if (receiver.fcmToken) {
            await sendPushNotification(
              receiver.fcmToken,
              `Incoming ${type} call`,
              `${caller.name} is calling you...`,
              {
                callId: callIdStr,
                type: 'call',
                channelName,
              }
            );
          }
        }
      } catch (error) {
        console.error('[Call Signaling Error] call_initiate:', error);
      }
    });

    // Group Call Initiate
    socket.on('group_call_initiate', async (data: { chatId: string; type: 'voice' | 'video' }) => {
      try {
        const { chatId, type } = data;
        const chat = await Chat.findById(chatId).populate('participants', '_id name avatarUrl');
        if (!chat) return;

        const channelName = `grp_call_${chatId}_${Date.now()}`;
        const caller = await User.findById(userId);
        if (!caller) return;

        const payload = {
          chatId,
          groupName: chat.groupName || 'Group Call',
          callerId: userId,
          callerName: caller.name,
          callerAvatar: caller.avatarUrl,
          channelName,
          type: type || 'voice',
        };

        activeUserCalls.set(userId, channelName);
        socket.to(chatId).emit('incoming_group_call', payload);
        socket.emit('group_call_initiated', { channelName, type });
      } catch (error) {
        console.error('[Call Signaling Error] group_call_initiate:', error);
      }
    });

    socket.on('call_accept', async (data: { callId: string }) => {
      try {
        const { callId } = data;
        const call = await Call.findById(callId);
        if (!call) {
          console.warn(`[Call Signaling] [ACCEPT FAILED] Call ${callId} not found`);
          return;
        }

        activeUserCalls.set(userId, callId);
        console.log(`[Call Signaling] [ACCEPT] Call ${callId} accepted by user ${userId}. Channel: ${call.channelName}`);
        const callerSocketId = onlineUsers.get(call.callerId.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit('call_accepted', {
            callId: call._id.toString(),
            channelName: call.channelName,
          });
        }
      } catch (error) {
        console.error('[Call Signaling Error] call_accept:', error);
      }
    });

    socket.on('call_decline', async (data: { callId: string }) => {
      try {
        const { callId } = data;
        activeUserCalls.delete(userId);
        const call = await Call.findByIdAndUpdate(callId, { status: 'declined' }, { new: true });
        if (!call) return;

        const callerIdStr = call.callerId.toString();
        activeUserCalls.delete(callerIdStr);

        const callerSocketId = onlineUsers.get(callerIdStr);
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
        activeUserCalls.delete(userId);
        const call = await Call.findByIdAndUpdate(
          callId,
          { status: 'completed', duration: duration || 0 },
          { new: true }
        );
        if (!call) return;

        const otherUserId = call.callerId.toString() === userId ? call.receiverId.toString() : call.callerId.toString();
        activeUserCalls.delete(otherUserId);

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
      activeUserCalls.delete(userId);
      console.log(`[Socket.io] User disconnected: ${userId}`);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user_offline', { userId, lastSeen: new Date() });
    });
  });
};
