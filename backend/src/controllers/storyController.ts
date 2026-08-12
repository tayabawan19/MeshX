import { Response } from 'express';
import Story from '../models/Story';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// POST /api/stories
export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { mediaUrl, type, caption, backgroundColor } = req.body;

    if (!type || !['image', 'video', 'text'].includes(type)) {
      return res.status(400).json({ error: 'Valid story type (image, video, text) is required.' });
    }

    if ((type === 'image' || type === 'video') && !mediaUrl) {
      return res.status(400).json({ error: 'mediaUrl is required for image/video stories.' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = new Story({
      userId: currentUserId,
      mediaUrl: mediaUrl || '',
      type,
      caption: caption || '',
      backgroundColor: backgroundColor || '#7C3AED',
      expiresAt,
      viewedBy: [],
    });

    await story.save();
    await story.populate('userId', '_id name avatarUrl');

    return res.status(201).json({ story });
  } catch (error: any) {
    console.error('Create story error:', error);
    return res.status(500).json({ error: 'Internal server error creating story.' });
  }
};

// GET /api/stories/feed
export const getStoriesFeed = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Exclude current user from feed (they use /mine), query contacts' active stories
    const contactIds = currentUser.contacts || [];

    const stories = await Story.find({
      userId: { $in: contactIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', '_id name avatarUrl')
      .sort({ createdAt: 1 });

    const groupedMap: { [key: string]: { user: any; stories: any[]; hasUnviewed: boolean; latestCreatedAt: Date } } = {};

    stories.forEach((story: any) => {
      const uId = story.userId._id.toString();
      if (!groupedMap[uId]) {
        groupedMap[uId] = {
          user: story.userId,
          stories: [],
          hasUnviewed: false,
          latestCreatedAt: story.createdAt,
        };
      }

      groupedMap[uId].stories.push(story);
      if (new Date(story.createdAt) > new Date(groupedMap[uId].latestCreatedAt)) {
        groupedMap[uId].latestCreatedAt = story.createdAt;
      }

      const isViewedByMe = story.viewedBy.some(
        (v: any) => v.userId?.toString() === currentUserId
      );

      if (!isViewedByMe) {
        groupedMap[uId].hasUnviewed = true;
      }
    });

    const storyGroups = Object.values(groupedMap).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime();
    });

    return res.status(200).json({ storyGroups });
  } catch (error: any) {
    console.error('Get stories feed error:', error);
    return res.status(500).json({ error: 'Internal server error fetching feed.' });
  }
};

// GET /api/stories/mine
export const getMyStories = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    const stories = await Story.find({
      userId: currentUserId,
      expiresAt: { $gt: new Date() },
    })
      .populate('viewedBy.userId', '_id name avatarUrl')
      .sort({ createdAt: 1 });

    return res.status(200).json({ stories });
  } catch (error: any) {
    console.error('Get my stories error:', error);
    return res.status(500).json({ error: 'Internal server error fetching my stories.' });
  }
};

// POST /api/stories/:storyId/view
export const viewStory = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const currentUserId = req.user?.userId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    const alreadyViewed = story.viewedBy.some(
      (v: any) => v.userId.toString() === currentUserId
    );

    if (!alreadyViewed && currentUserId) {
      story.viewedBy.push({
        userId: currentUserId as any,
        viewedAt: new Date(),
      });
      await story.save();
    }

    return res.status(200).json({ message: 'Story view registered.', story });
  } catch (error: any) {
    console.error('View story error:', error);
    return res.status(500).json({ error: 'Internal server error registering view.' });
  }
};

// DELETE /api/stories/:storyId
export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const currentUserId = req.user?.userId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    if (story.userId.toString() !== currentUserId) {
      return res.status(403).json({ error: 'Unauthorized to delete this story.' });
    }

    await Story.findByIdAndDelete(storyId);
    return res.status(200).json({ message: 'Story deleted successfully.' });
  } catch (error: any) {
    console.error('Delete story error:', error);
    return res.status(500).json({ error: 'Internal server error deleting story.' });
  }
};
