import { Response } from 'express';
import Call from '../models/Call';
import { AuthRequest } from '../middleware/authMiddleware';

// POST /api/calls/token
export const generateAgoraToken = async (req: AuthRequest, res: Response) => {
  try {
    const { channelName } = req.body;
    const currentUserId = req.user?.userId;

    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required.' });
    }

    const appId = process.env.AGORA_APP_ID || '';
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || '';

    let uid = 0;
    if (currentUserId) {
      let hash = 0;
      for (let i = 0; i < currentUserId.length; i++) {
        hash = (hash << 5) - hash + currentUserId.charCodeAt(i);
        hash |= 0;
      }
      uid = Math.abs(hash);
    }

    let token = '';

    if (appId && appCertificate) {
      try {
        const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        token = RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          channelName,
          uid,
          RtcRole.PUBLISHER,
          privilegeExpiredTs
        );
        console.log(`[Agora Token Success] Signed token generated for channel=${channelName}, uid=${uid}`);
      } catch (err: any) {
        console.warn('[Agora Token Warning]', err?.message || err);
      }
    }

    if (!token) {
      token = `agora_rtc_token_${channelName}_${uid}_${Date.now()}`;
      console.log(`[Agora Token Fallback] Using dev token for channel=${channelName}, uid=${uid}`);
    }

    return res.status(200).json({
      token,
      appId,
      channelName,
      uid,
    });
  } catch (error: any) {
    console.error('Generate Agora token error:', error);
    return res.status(500).json({ error: 'Internal server error generating token.' });
  }
};

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
    const { receiverId, type, status, duration, channelName } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required.' });
    }

    const call = new Call({
      callerId: currentUserId,
      receiverId,
      type: type || 'voice',
      status: status || 'completed',
      duration: duration || 0,
      channelName: channelName || `channel_${Date.now()}`,
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
