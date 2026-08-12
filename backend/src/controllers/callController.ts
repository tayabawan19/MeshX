import { Response } from 'express';
import Call from '../models/Call';
import { AuthRequest } from '../middleware/authMiddleware';

// GET /api/calls
export const getCallHistory = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    const calls = await Call.find({
      $or: [{ callerId: currentUserId }, { receiverId: currentUserId }],
    })
      .populate('callerId', '_id name avatarUrl')
      .populate('receiverId', '_id name avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({ calls });
  } catch (error: any) {
    console.error('Get calls error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/calls
export const createCallLog = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { receiverId, type, status, duration } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required.' });
    }

    const call = new Call({
      callerId: currentUserId,
      receiverId,
      type: type || 'voice',
      status: status || 'completed',
      duration: duration || 0,
    });

    await call.save();
    await call.populate('callerId', '_id name avatarUrl');
    await call.populate('receiverId', '_id name avatarUrl');

    return res.status(201).json({ call });
  } catch (error: any) {
    console.error('Create call log error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
