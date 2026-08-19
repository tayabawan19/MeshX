import { Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Chat from '../models/Chat';
import Message from '../models/Message';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../sockets/chatSocket';

// Helper to format chat document for the requesting user
export const formatChatForUser = (chatDoc: any, currentUserId: string) => {
  const chatObj = chatDoc.toObject ? chatDoc.toObject() : { ...chatDoc };

  let unreadCount = 0;
  if (chatObj.unreadCounts) {
    if (chatObj.unreadCounts instanceof Map) {
      unreadCount = chatObj.unreadCounts.get(currentUserId) || 0;
    } else if (typeof chatObj.unreadCounts === 'object') {
      unreadCount = chatObj.unreadCounts[currentUserId] || 0;
    }
  }
  chatObj.unreadCount = unreadCount;

  chatObj.isMuted = chatObj.mutedBy?.some((id: any) => id.toString() === currentUserId) || false;
  chatObj.isArchived = chatObj.archivedBy?.some((id: any) => id.toString() === currentUserId) || false;

  if (chatObj.type === 'direct' && Array.isArray(chatObj.participants)) {
    const other = chatObj.participants.find(
      (p: any) => (p?._id ? p._id.toString() : p?.toString()) !== currentUserId
    );
    if (other && typeof other === 'object') {
      chatObj.otherParticipant = {
        _id: other._id?.toString() || other._id,
        id: other._id?.toString() || other._id,
        name: other.name || 'User',
        avatarUrl: other.avatarUrl || '',
        bio: other.bio || '',
        isOnline: !!other.isOnline,
        lastSeen: other.lastSeen,
      };
      chatObj.participantProfiles = [chatObj.otherParticipant];
    }
  } else if (chatObj.type === 'group' && Array.isArray(chatObj.participants)) {
    chatObj.participantProfiles = chatObj.participants
      .filter((p: any) => typeof p === 'object')
      .map((p: any) => ({
        _id: p._id?.toString() || p._id,
        id: p._id?.toString() || p._id,
        name: p.name || 'User',
        avatarUrl: p.avatarUrl || '',
        bio: p.bio || '',
        isOnline: !!p.isOnline,
        lastSeen: p.lastSeen,
      }));
  }

  chatObj.chatId = chatObj._id?.toString() || chatObj.id;
  return chatObj;
};

// GET /api/chats (optionally ?archived=true)
export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    const isArchivedQuery = req.query.archived === 'true';

    const filter: any = { participants: currentUserId };
    if (isArchivedQuery) {
      filter.archivedBy = currentUserId;
    } else {
      filter.archivedBy = { $ne: currentUserId };
    }

    const rawChats = await Chat.find(filter)
      .populate('participants', '_id name avatarUrl bio isOnline lastSeen')
      .populate('admins', '_id name avatarUrl')
      .sort({ updatedAt: -1 });

    const chats = rawChats.map((c) => formatChatForUser(c, currentUserId));

    return res.status(200).json({ chats });
  } catch (error: any) {
    console.error('Get chats error:', error);
    return res.status(500).json({ error: 'Internal server error getting chats.' });
  }
};

// GET /api/chats/archived
export const getArchivedChats = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    const rawChats = await Chat.find({
      participants: currentUserId,
      archivedBy: currentUserId,
    })
      .populate('participants', '_id name avatarUrl bio isOnline lastSeen')
      .populate('admins', '_id name avatarUrl')
      .sort({ updatedAt: -1 });

    const chats = rawChats.map((c) => formatChatForUser(c, currentUserId));
    return res.status(200).json({ chats });
  } catch (error: any) {
    console.error('Get archived chats error:', error);
    return res.status(500).json({ error: 'Internal server error getting archived chats.' });
  }
};

// PATCH /api/chats/:chatId/archive
export const toggleArchiveChat = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { archived } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (!chat.participants.some((p: any) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const cIdObj = currentUserId as any;
    if (archived) {
      if (!chat.archivedBy.includes(cIdObj)) {
        chat.archivedBy.push(cIdObj);
      }
    } else {
      chat.archivedBy = chat.archivedBy.filter((id: any) => id.toString() !== currentUserId);
    }

    await chat.save();
    return res.status(200).json({ success: true, isArchived: !!archived, chatId });
  } catch (error: any) {
    console.error('Toggle archive chat error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/direct
export const createOrGetDirectChat = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });
    const otherUserId = req.body.otherUserId || req.body.recipientId;

    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required.' });
    }

    const currentUser = await User.findById(currentUserId);
    const recipientUser = await User.findById(otherUserId);

    if (!currentUser || !recipientUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isBlocked =
      currentUser.blockedUsers.includes(otherUserId as any) ||
      recipientUser.blockedUsers.includes(currentUserId as any);

    if (isBlocked) {
      return res.status(403).json({ error: 'Cannot create chat with this user.' });
    }

    let chat = await Chat.findOne({
      type: 'direct',
      participants: { $all: [currentUserId, otherUserId] },
    }).populate('participants', '_id name avatarUrl bio isOnline lastSeen');

    if (!chat) {
      chat = new Chat({
        type: 'direct',
        participants: [currentUserId, otherUserId],
        bubbleTheme: {
          sentGradient: ['#6366f1', '#8b5cf6'],
          receivedColor: '#1f2937',
        },
        unreadCounts: {},
      });
      await chat.save();
      await chat.populate('participants', '_id name avatarUrl bio isOnline lastSeen');
    }

    if (!currentUser.contacts.includes(otherUserId as any)) {
      currentUser.contacts.push(otherUserId as any);
      await currentUser.save();
    }
    if (!recipientUser.contacts.includes(currentUserId as any)) {
      recipientUser.contacts.push(currentUserId as any);
      await recipientUser.save();
    }

    const formattedChat = formatChatForUser(chat, currentUserId);
    return res.status(200).json({ chat: formattedChat });
  } catch (error: any) {
    console.error('Create or get direct chat error:', error);
    return res.status(500).json({ error: 'Internal server error creating chat.' });
  }
};

// POST /api/chats/group
export const createGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });
    const { groupName, groupAvatar, groupDescription, participantIds } = req.body;

    if (!groupName || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'Group name and participant IDs array are required.' });
    }

    const participants = Array.from(new Set([currentUserId, ...participantIds]));
    const inviteCode = crypto.randomBytes(6).toString('hex');

    const groupChat = new Chat({
      type: 'group',
      groupName: groupName.trim(),
      groupAvatar: groupAvatar || '',
      groupDescription: groupDescription || '',
      participants,
      admins: [currentUserId],
      inviteCode,
      bubbleTheme: {
        sentGradient: ['#06b6d4', '#3b82f6'],
        receivedColor: '#1f2937',
      },
      unreadCounts: {},
    });

    await groupChat.save();
    await groupChat.populate('participants', '_id name avatarUrl bio isOnline lastSeen');
    await groupChat.populate('admins', '_id name avatarUrl');

    // Create initial system message: "[Creator] created group [GroupName]"
    const creatorUser = await User.findById(currentUserId);
    const creatorName = creatorUser?.name || 'Someone';

    const systemMsg = new Message({
      chatId: groupChat._id,
      senderId: currentUserId,
      type: 'system',
      text: `${creatorName} created group "${groupName.trim()}"`,
      status: 'sent',
    });
    await systemMsg.save();

    const formattedGroup = formatChatForUser(groupChat, currentUserId);
    return res.status(201).json({ chat: formattedGroup });
  } catch (error: any) {
    console.error('Create group chat error:', error);
    return res.status(500).json({ error: 'Internal server error creating group chat.' });
  }
};

// GET /api/chats/:chatId/messages
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { before, limit } = req.query;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId format.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      (p: any) => p.toString() === currentUserId
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this chat.' });
    }

    const queryCondition: any = {
      chatId,
      deletedFor: { $ne: currentUserId },
    };

    if (before && typeof before === 'string' && mongoose.Types.ObjectId.isValid(before)) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        queryCondition.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 50;

    const messages = await Message.find(queryCondition)
      .populate('senderId', '_id name avatarUrl')
      .populate('replyTo')
      .populate('deliveredTo.userId', '_id name avatarUrl')
      .populate('readBy.userId', '_id name avatarUrl')
      .sort({ createdAt: 1 })
      .limit(limitNum);

    return res.status(200).json({ messages });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/:chatId/messages
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { text, type, mediaUrl, replyTo, storyReply, isForwarded, forwardCount, expiresAt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId format.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      (p: any) => p.toString() === currentUserId
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this chat.' });
    }

    if (chat.type === 'group' && chat.onlyAdminsCanMessage) {
      const isAdmin = chat.admins?.some((a: any) => a.toString() === currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only admins can send messages in this group.' });
      }
    }

    if (chat.type === 'direct') {
      const otherParticipantId = chat.participants.find(
        (p: any) => p.toString() !== currentUserId
      );
      if (otherParticipantId) {
        const currentUser = await User.findById(currentUserId);
        const otherUser = await User.findById(otherParticipantId);
        if (
          currentUser?.blockedUsers.includes(otherParticipantId as any) ||
          otherUser?.blockedUsers.includes(currentUserId as any)
        ) {
          return res.status(403).json({ error: 'Message blocked.' });
        }
      }
    }

    const validReplyTo = replyTo && mongoose.Types.ObjectId.isValid(replyTo) ? replyTo : null;

    const message = new Message({
      chatId,
      senderId: currentUserId,
      type: type || 'text',
      text: text || '',
      mediaUrl: mediaUrl || '',
      replyTo: validReplyTo,
      storyReply: storyReply || undefined,
      isForwarded: !!isForwarded,
      forwardCount: forwardCount || (isForwarded ? 1 : 0),
      status: 'sent',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await message.save();
    await message.populate('senderId', '_id name avatarUrl');
    if (validReplyTo) {
      await message.populate('replyTo');
    }

    const recipients = chat.participants.filter((p: any) => p.toString() !== currentUserId);
    const incUpdates: Record<string, number> = {};
    for (const r of recipients) {
      incUpdates[`unreadCounts.${r.toString()}`] = 1;
    }

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: type === 'text' ? text : `[${type}]`,
        senderId: currentUserId,
        type: type || 'text',
        createdAt: new Date(),
      },
      ...(Object.keys(incUpdates).length > 0 ? { $inc: incUpdates } : {}),
    });

    const io = getIO();
    if (io) {
      io.to(chatId).emit('receive_message', message);
    }

    return res.status(201).json({ message });
  } catch (error: any) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/chats/:chatId/messages/:messageId/everyone (1 hour limit)
export const deleteMessageForEveryone = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    if (message.senderId.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete your own messages for everyone.' });
    }

    const oneHourMs = 60 * 60 * 1000;
    if (Date.now() - new Date(message.createdAt).getTime() > oneHourMs) {
      return res.status(400).json({ error: 'Messages can only be deleted for everyone within 1 hour.' });
    }

    message.isDeletedForEveryone = true;
    message.text = 'This message was deleted';
    message.mediaUrl = '';
    message.type = 'text';
    await message.save();

    const io = getIO();
    if (io) {
      io.to(chatId).emit('message_deleted_everyone', { messageId, chatId });
    }

    return res.status(200).json({ success: true, messageId, chatId });
  } catch (error: any) {
    console.error('Delete message for everyone error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/chats/:chatId/messages/:messageId/me
export const deleteMessageForMe = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    if (!message.deletedFor.includes(currentUserId as any)) {
      message.deletedFor.push(currentUserId as any);
      await message.save();
    }

    return res.status(200).json({ success: true, messageId });
  } catch (error: any) {
    console.error('Delete message for me error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/chats/:chatId/messages/:messageId (Edit within 15 mins)
export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId, messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Updated text content is required.' });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    if (message.senderId.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only edit your own messages.' });
    }

    if (message.isDeletedForEveryone) {
      return res.status(400).json({ error: 'Cannot edit a deleted message.' });
    }

    const fifteenMinsMs = 15 * 60 * 1000;
    if (Date.now() - new Date(message.createdAt).getTime() > fifteenMinsMs) {
      return res.status(400).json({ error: 'Messages can only be edited within 15 minutes of sending.' });
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const io = getIO();
    if (io) {
      io.to(chatId).emit('message_edited', {
        messageId,
        chatId,
        text: message.text,
        isEdited: true,
        editedAt: message.editedAt,
      });
    }

    return res.status(200).json({ success: true, message });
  } catch (error: any) {
    console.error('Edit message error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/forward
export const forwardMessages = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { messageIds, targetChatIds } = req.body;

    if (!Array.isArray(messageIds) || !Array.isArray(targetChatIds) || messageIds.length === 0 || targetChatIds.length === 0) {
      return res.status(400).json({ error: 'messageIds and targetChatIds arrays are required.' });
    }

    const sourceMessages = await Message.find({ _id: { $in: messageIds } });
    const results: any[] = [];
    const io = getIO();

    for (const targetChatId of targetChatIds) {
      const chat = await Chat.findById(targetChatId);
      if (!chat || !chat.participants.some((p: any) => p.toString() === currentUserId)) continue;

      for (const msg of sourceMessages) {
        if (msg.isDeletedForEveryone) continue;

        const forwardedMsg = new Message({
          chatId: targetChatId,
          senderId: currentUserId,
          type: msg.type,
          text: msg.text,
          mediaUrl: msg.mediaUrl,
          duration: msg.duration,
          isForwarded: true,
          forwardCount: (msg.forwardCount || 0) + 1,
          status: 'sent',
        });

        await forwardedMsg.save();
        await forwardedMsg.populate('senderId', '_id name avatarUrl');
        results.push(forwardedMsg);

        if (io) {
          io.to(targetChatId).emit('receive_message', forwardedMsg);
        }
      }
    }

    return res.status(201).json({ success: true, forwardedCount: results.length });
  } catch (error: any) {
    console.error('Forward messages error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/chats/:chatId/messages/:messageId/info
export const getMessageInfo = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate('senderId', '_id name avatarUrl')
      .populate('deliveredTo.userId', '_id name avatarUrl')
      .populate('readBy.userId', '_id name avatarUrl');

    if (!message) return res.status(404).json({ error: 'Message not found.' });

    if (message.senderId._id.toString() !== currentUserId && (message.senderId as any).toString() !== currentUserId) {
      return res.status(403).json({ error: 'Only the sender can view message info.' });
    }

    return res.status(200).json({
      messageId: message._id,
      createdAt: message.createdAt,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
      deliveredTo: message.deliveredTo,
      readBy: message.readBy,
      status: message.status,
    });
  } catch (error: any) {
    console.error('Get message info error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/:chatId/group/admins (promote / demote)
export const promoteDemoteAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { targetUserId, action } = req.body; // action: 'promote' | 'demote'

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group chat not found.' });

    const isCurrentAdmin = chat.admins.some((a: any) => a.toString() === currentUserId);
    if (!isCurrentAdmin) {
      return res.status(403).json({ error: 'Only group admins can manage roles.' });
    }

    const tIdObj = targetUserId as any;
    const targetUser = await User.findById(targetUserId);
    const targetName = targetUser?.name || 'User';

    let sysText = '';
    if (action === 'promote') {
      if (!chat.admins.includes(tIdObj)) {
        chat.admins.push(tIdObj);
        sysText = `${targetName} is now an admin`;
      }
    } else if (action === 'demote') {
      chat.admins = chat.admins.filter((a: any) => a.toString() !== targetUserId);
      sysText = `${targetName} is no longer an admin`;
    }

    await chat.save();

    if (sysText) {
      const sysMsg = new Message({
        chatId: chat._id,
        senderId: currentUserId,
        type: 'system',
        text: sysText,
      });
      await sysMsg.save();
      const io = getIO();
      if (io) io.to(chatId).emit('receive_message', sysMsg);
    }

    return res.status(200).json({ success: true, admins: chat.admins });
  } catch (error: any) {
    console.error('Promote/demote admin error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/:chatId/group/members (Add members)
export const addGroupMembers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'memberIds array is required.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group not found.' });

    const isCurrentAdmin = chat.admins.some((a: any) => a.toString() === currentUserId);
    if (chat.onlyAdminsCanEditInfo && !isCurrentAdmin) {
      return res.status(403).json({ error: 'Only admins can add members.' });
    }

    const addedUsers = await User.find({ _id: { $in: memberIds } });
    const addedNames = addedUsers.map((u) => u.name).join(', ');

    memberIds.forEach((mId: string) => {
      if (!chat.participants.some((p: any) => p.toString() === mId)) {
        chat.participants.push(mId as any);
      }
    });

    await chat.save();

    const currentUser = await User.findById(currentUserId);
    const sysMsg = new Message({
      chatId: chat._id,
      senderId: currentUserId,
      type: 'system',
      text: `${currentUser?.name || 'Someone'} added ${addedNames}`,
    });
    await sysMsg.save();

    const io = getIO();
    if (io) io.to(chatId).emit('receive_message', sysMsg);

    return res.status(200).json({ success: true, participants: chat.participants });
  } catch (error: any) {
    console.error('Add group members error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/chats/:chatId/group/members/:memberId (Remove member)
export const removeGroupMember = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId, memberId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group not found.' });

    const isCurrentAdmin = chat.admins.some((a: any) => a.toString() === currentUserId);
    if (!isCurrentAdmin) {
      return res.status(403).json({ error: 'Only admins can remove members.' });
    }

    const removedUser = await User.findById(memberId);
    chat.participants = chat.participants.filter((p: any) => p.toString() !== memberId);
    chat.admins = chat.admins.filter((a: any) => a.toString() !== memberId);

    await chat.save();

    const currentUser = await User.findById(currentUserId);
    const sysMsg = new Message({
      chatId: chat._id,
      senderId: currentUserId,
      type: 'system',
      text: `${currentUser?.name || 'Admin'} removed ${removedUser?.name || 'User'}`,
    });
    await sysMsg.save();

    const io = getIO();
    if (io) io.to(chatId).emit('receive_message', sysMsg);

    return res.status(200).json({ success: true, participants: chat.participants });
  } catch (error: any) {
    console.error('Remove group member error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/:chatId/group/leave
export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group not found.' });

    chat.participants = chat.participants.filter((p: any) => p.toString() !== currentUserId);
    chat.admins = chat.admins.filter((a: any) => a.toString() !== currentUserId);

    // If no admins left and participants remain, promote first participant
    if (chat.admins.length === 0 && chat.participants.length > 0) {
      chat.admins.push(chat.participants[0]);
    }

    await chat.save();

    const currentUser = await User.findById(currentUserId);
    const sysMsg = new Message({
      chatId: chat._id,
      senderId: currentUserId,
      type: 'system',
      text: `${currentUser?.name || 'Someone'} left the group`,
    });
    await sysMsg.save();

    const io = getIO();
    if (io) io.to(chatId).emit('receive_message', sysMsg);

    return res.status(200).json({ success: true, chatId });
  } catch (error: any) {
    console.error('Leave group error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/chats/:chatId/group/settings
export const updateGroupSettings = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { onlyAdminsCanMessage, onlyAdminsCanEditInfo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group not found.' });

    const isCurrentAdmin = chat.admins.some((a: any) => a.toString() === currentUserId);
    if (!isCurrentAdmin) {
      return res.status(403).json({ error: 'Only admins can update group settings.' });
    }

    if (onlyAdminsCanMessage !== undefined) chat.onlyAdminsCanMessage = !!onlyAdminsCanMessage;
    if (onlyAdminsCanEditInfo !== undefined) chat.onlyAdminsCanEditInfo = !!onlyAdminsCanEditInfo;

    await chat.save();
    return res.status(200).json({ success: true, chat });
  } catch (error: any) {
    console.error('Update group settings error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/chats/:chatId/group/info
export const updateGroupInfo = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { groupName, groupAvatar, groupDescription } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group not found.' });

    const isCurrentAdmin = chat.admins.some((a: any) => a.toString() === currentUserId);
    if (chat.onlyAdminsCanEditInfo && !isCurrentAdmin) {
      return res.status(403).json({ error: 'Only admins can edit group info.' });
    }

    if (groupName !== undefined) chat.groupName = groupName.trim();
    if (groupAvatar !== undefined) chat.groupAvatar = groupAvatar;
    if (groupDescription !== undefined) chat.groupDescription = groupDescription.trim();

    await chat.save();
    return res.status(200).json({ success: true, chat });
  } catch (error: any) {
    console.error('Update group info error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/:chatId/invite-link
export const getGroupInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group not found.' });

    if (!chat.inviteCode) {
      chat.inviteCode = crypto.randomBytes(6).toString('hex');
      await chat.save();
    }

    return res.status(200).json({ inviteCode: chat.inviteCode });
  } catch (error: any) {
    console.error('Get group invite link error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/join/:inviteCode
export const joinGroupByInviteCode = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { inviteCode } = req.params;

    const chat = await Chat.findOne({ inviteCode, type: 'group' });
    if (!chat) return res.status(404).json({ error: 'Invalid or expired invite link.' });

    const alreadyMember = chat.participants.some((p: any) => p.toString() === currentUserId);
    if (!alreadyMember) {
      chat.participants.push(currentUserId as any);
      await chat.save();

      const user = await User.findById(currentUserId);
      const sysMsg = new Message({
        chatId: chat._id,
        senderId: currentUserId,
        type: 'system',
        text: `${user?.name || 'Someone'} joined via invite link`,
      });
      await sysMsg.save();

      const io = getIO();
      if (io) io.to(chat._id.toString()).emit('receive_message', sysMsg);
    }

    await chat.populate('participants', '_id name avatarUrl bio isOnline lastSeen');
    await chat.populate('admins', '_id name avatarUrl');

    const formattedChat = formatChatForUser(chat, currentUserId!);
    return res.status(200).json({ chat: formattedChat });
  } catch (error: any) {
    console.error('Join group error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/chats/:chatId/read
export const markChatRead = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId format.' });
    }

    await Chat.findByIdAndUpdate(chatId, {
      $set: { [`unreadCounts.${currentUserId}`]: 0 },
    });

    await Message.updateMany(
      { chatId, senderId: { $ne: currentUserId }, status: { $ne: 'read' } },
      {
        $set: { status: 'read' },
        $addToSet: { readBy: { userId: currentUserId as any, readAt: new Date() } },
      }
    );

    return res.status(200).json({ success: true, chatId });
  } catch (error: any) {
    console.error('Mark chat read error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/chats/:chatId/theme
export const updateChatTheme = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { sentGradient, receivedColor, wallpaper } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (!chat.participants.some((p: any) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (sentGradient || receivedColor) {
      chat.bubbleTheme = {
        sentGradient: sentGradient || chat.bubbleTheme.sentGradient,
        receivedColor: receivedColor || chat.bubbleTheme.receivedColor,
      };
    }
    if (wallpaper !== undefined) {
      chat.wallpaper = wallpaper;
    }

    await chat.save();
    return res.status(200).json({ chat });
  } catch (error: any) {
    console.error('Update chat theme error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/chats/:chatId/wallpaper
export const updateChatWallpaper = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { wallpaper } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (!chat.participants.some((p: any) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    chat.wallpaper = wallpaper;
    await chat.save();
    return res.status(200).json({ chat });
  } catch (error: any) {
    console.error('Update wallpaper error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/chats/:chatId/mute
export const toggleMuteChat = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { muted } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (!chat.participants.some((p: any) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const cIdObj = currentUserId as any;
    if (muted) {
      if (!chat.mutedBy.includes(cIdObj)) {
        chat.mutedBy.push(cIdObj);
      }
    } else {
      chat.mutedBy = chat.mutedBy.filter((id: any) => id.toString() !== currentUserId);
    }

    await chat.save();
    return res.status(200).json({ chat, isMuted: muted });
  } catch (error: any) {
    console.error('Toggle mute chat error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/chats/:chatId/disappearing
export const updateDisappearingMessages = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { chatId } = req.params;
    const { duration } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (!chat.participants.some((p: any) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    chat.disappearingDuration = duration !== undefined ? duration : null;
    await chat.save();

    return res.status(200).json({ chat });
  } catch (error: any) {
    console.error('Update disappearing error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
