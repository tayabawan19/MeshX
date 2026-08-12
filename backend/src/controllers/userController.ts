import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendInviteEmail } from '../services/emailService';

// GET /api/users/me
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const user = await User.findById(currentUserId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isVerified: user.isVerified,
        isOnline: user.isOnline,
        privacy: user.privacy,
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: 'Internal server error getting user.' });
  }
};

// GET /api/users/search?query=
export const searchUser = async (req: AuthRequest, res: Response) => {

  try {
    const query = req.query.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query parameter is required.' });
    }

    const cleanQuery = query.trim().toLowerCase();
    const currentUserId = req.user?.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found.' });
    }

    const targetUser = await User.findOne({
      $or: [
        { email: cleanQuery },
        { phone: query.trim() },
      ],
      _id: { $ne: currentUserId },
    }).select('_id name avatarUrl bio blockedUsers');

    if (!targetUser) {
      return res.status(200).json({
        found: false,
        message: 'No MeshX user found with that email/phone.',
      });
    }


    // Blocked users check: filter out if either user blocked the other
    const currentHasBlockedTarget = currentUser.blockedUsers?.some(
      (id: any) => id.toString() === targetUser._id.toString()
    );
    const targetHasBlockedCurrent = targetUser.blockedUsers?.some(
      (id: any) => id.toString() === currentUserId
    );

    if (currentHasBlockedTarget || targetHasBlockedCurrent) {
      return res.status(200).json({
        found: false,
        message: 'No MeshX user found with that email/phone.',
      });
    }


    const isContact = currentUser.contacts.some(
      (contactId: any) => contactId.toString() === targetUser._id.toString()
    );

    // Strictly return only _id, name, avatarUrl, bio as mandated by security rules
    return res.status(200).json({
      found: true,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        avatarUrl: targetUser.avatarUrl,
        bio: targetUser.bio,
      },
      isContact: !!isContact,
    });
  } catch (error: any) {
    console.error('Search user error:', error);
    return res.status(500).json({ error: 'Internal server error searching user.' });
  }
};

// POST /api/users/add-contact
export const addContact = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.body;
    const currentUserId = req.user?.userId;

    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required.' });
    }

    const currentUser = await User.findById(currentUserId);
    const contactUser = await User.findById(contactId);

    if (!currentUser || !contactUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if blocked
    if (
      currentUser.blockedUsers.includes(contactUser._id as any) ||
      contactUser.blockedUsers.includes(currentUser._id as any)
    ) {
      return res.status(403).json({ error: 'Cannot add this user to contacts.' });
    }

    if (!currentUser.contacts.includes(contactUser._id as any)) {
      currentUser.contacts.push(contactUser._id as any);
      await currentUser.save();
    }

    return res.status(200).json({
      message: 'Contact added successfully.',
      contact: {
        id: contactUser._id,
        name: contactUser.name,
        avatarUrl: contactUser.avatarUrl,
        bio: contactUser.bio,
      },
    });
  } catch (error: any) {
    console.error('Add contact error:', error);
    return res.status(500).json({ error: 'Internal server error adding contact.' });
  }
};

// GET /api/users/contacts
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUser = await User.findById(currentUserId).populate(
      'contacts',
      '_id name avatarUrl bio isOnline lastSeen'
    );

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Filter out any contacts that have blocked current user
    const filteredContacts = currentUser.contacts.filter((c: any) => {
      return !currentUser.blockedUsers.includes(c._id);
    });

    return res.status(200).json({ contacts: filteredContacts });
  } catch (error: any) {
    console.error('Get contacts error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/users/invite
export const inviteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    const currentUserId = req.user?.userId;

    if (!email) {
      return res.status(400).json({ error: 'Email is required to send invite.' });
    }

    const currentUser = await User.findById(currentUserId);
    const inviterName = currentUser?.name || 'A MeshX user';


    await sendInviteEmail(email.trim().toLowerCase(), inviterName);

    return res.status(200).json({ message: `Invitation sent to ${email} via Brevo.` });
  } catch (error: any) {
    console.error('Invite user error:', error);
    return res.status(500).json({ error: 'Internal server error inviting user.' });
  }
};

// PUT /api/users/profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { name, bio, avatarUrl, privacy } = req.body;

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (privacy) {
      user.privacy = {
        ...user.privacy,
        ...privacy,
      };
    }

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        privacy: user.privacy,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/users/block
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required.' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.blockedUsers.includes(targetUserId as any)) {
      currentUser.blockedUsers.push(targetUserId as any);
      await currentUser.save();
    }

    return res.status(200).json({ message: 'User blocked successfully.' });
  } catch (error: any) {
    console.error('Block user error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/users/unblock
export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required.' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id: any) => id.toString() !== targetUserId
    );
    await currentUser.save();

    return res.status(200).json({ message: 'User unblocked successfully.' });
  } catch (error: any) {
    console.error('Unblock user error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/users/privacy
export const updatePrivacy = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { lastSeenVisible, readReceiptsEnabled } = req.body;

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.privacy = {
      lastSeenVisible: lastSeenVisible !== undefined ? lastSeenVisible : user.privacy?.lastSeenVisible ?? true,
      readReceiptsEnabled: readReceiptsEnabled !== undefined ? readReceiptsEnabled : user.privacy?.readReceiptsEnabled ?? true,
    };

    await user.save();
    return res.status(200).json({ message: 'Privacy updated successfully.', privacy: user.privacy });
  } catch (error: any) {
    console.error('Update privacy error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/users/blocked
export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const user = await User.findById(currentUserId).populate('blockedUsers', '_id name avatarUrl bio');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.status(200).json({ blockedUsers: user.blockedUsers });
  } catch (error: any) {
    console.error('Get blocked users error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/users/block/:userId
export const blockUserByParam = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { userId } = req.params;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });

    if (!currentUser.blockedUsers.includes(userId as any)) {
      currentUser.blockedUsers.push(userId as any);
      await currentUser.save();
    }

    return res.status(200).json({ message: 'User blocked successfully.' });
  } catch (error: any) {
    console.error('Block user param error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/users/block/:userId
export const unblockUserByParam = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { userId } = req.params;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id: any) => id.toString() !== userId
    );
    await currentUser.save();

    return res.status(200).json({ message: 'User unblocked successfully.' });
  } catch (error: any) {
    console.error('Unblock user param error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/users/me
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const Chat = require('../models/Chat').default;
    const RefreshToken = require('../models/RefreshToken').default;

    await User.findByIdAndDelete(currentUserId);
    await Chat.updateMany({ participants: currentUserId }, { $pull: { participants: currentUserId } });
    await RefreshToken.deleteMany({ userId: currentUserId });

    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Internal server error deleting account.' });
  }
};

// POST /api/users/fcm-token
export const updateFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'fcmToken is required.' });
    }

    await User.findByIdAndUpdate(currentUserId, { fcmToken });
    console.log(`[FCM Token Registered] User ${currentUserId} updated token to ${fcmToken.slice(0, 15)}...`);

    return res.status(200).json({ message: 'FCM token updated successfully.' });
  } catch (error: any) {
    console.error('Update FCM token error:', error);
    return res.status(500).json({ error: 'Internal server error updating FCM token.' });
  }
};



