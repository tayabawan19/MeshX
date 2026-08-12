import { Response } from 'express';
import Chat from '../models/Chat';
import Message from '../models/Message';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// GET /api/chats
export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    const chats = await Chat.find({ participants: currentUserId })
      .populate('participants', '_id name avatarUrl bio isOnline lastSeen')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ chats });
  } catch (error: any) {
    console.error('Get chats error:', error);
    return res.status(500).json({ error: 'Internal server error getting chats.' });
  }
};

// POST /api/chats/direct
export const createOrGetDirectChat = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const otherUserId = req.body.otherUserId || req.body.recipientId;

    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required.' });
    }

    const currentUser = await User.findById(currentUserId);
    const recipientUser = await User.findById(otherUserId);

    if (!currentUser || !recipientUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if blocked in either direction
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
      });
      await chat.save();
      await chat.populate('participants', '_id name avatarUrl bio isOnline lastSeen');
    }

    // Add each other to contacts if not already there
    if (!currentUser.contacts.includes(otherUserId as any)) {
      currentUser.contacts.push(otherUserId as any);
      await currentUser.save();
    }
    if (!recipientUser.contacts.includes(currentUserId as any)) {
      recipientUser.contacts.push(currentUserId as any);
      await recipientUser.save();
    }

    return res.status(200).json({ chat });

  } catch (error: any) {
    console.error('Create or get direct chat error:', error);
    return res.status(500).json({ error: 'Internal server error creating chat.' });
  }
};

// POST /api/chats/group
export const createGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { groupName, groupAvatar, participantIds } = req.body;

    if (!groupName || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'Group name and participant IDs array are required.' });
    }

    const participants = Array.from(new Set([currentUserId, ...participantIds]));

    const groupChat = new Chat({
      type: 'group',
      groupName: groupName.trim(),
      groupAvatar: groupAvatar || '',
      participants,
      bubbleTheme: {
        sentGradient: ['#06b6d4', '#3b82f6'],
        receivedColor: '#1f2937',
      },
    });

    await groupChat.save();
    await groupChat.populate('participants', '_id name avatarUrl bio isOnline lastSeen');

    return res.status(201).json({ chat: groupChat });
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

    const queryCondition: any = { chatId };
    if (before && typeof before === 'string') {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        queryCondition.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 50;

    const messages = await Message.find(queryCondition)
      .populate('senderId', '_id name avatarUrl')
      .populate('replyTo')
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
    const { text, type, mediaUrl, replyTo, expiresAt } = req.body;

    // Security check: Verify participant membership
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

    // In direct chats, check for block status between participants
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

    const message = new Message({
      chatId,
      senderId: currentUserId,
      type: type || 'text',
      text: text || '',
      mediaUrl: mediaUrl || '',
      replyTo: replyTo || null,
      status: 'sent',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await message.save();
    await message.populate('senderId', '_id name avatarUrl');
    if (replyTo) {
      await message.populate('replyTo');
    }

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: type === 'text' ? text : `[${type}]`,
        senderId: currentUserId,
        type: type || 'text',
        createdAt: new Date(),
      },
    });

    return res.status(201).json({ message });
  } catch (error: any) {
    console.error('Send message error:', error);
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
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      (p: any) => p.toString() === currentUserId
    );

    if (!isParticipant) {
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

