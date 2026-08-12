import { Response } from 'express';
import Story from '../models/Story';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// POST /api/stories
export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const { mediaUrl, type, caption, backgroundColor } = req.body;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = new Story({
      userId: currentUserId,
      mediaUrl: mediaUrl || '',
      type: type || 'text',
      caption: caption || '',
      backgroundColor: backgroundColor || '#4f46e5',
      expiresAt,
      viewedBy: [],
    });

    await story.save();
    await story.populate('userId', '_id name avatarUrl');

    return res.status(201).json({ story });
  } catch (error: any) {
    console.error('Create story error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/stories
export const getActiveStories = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userIds = [currentUser._id, ...currentUser.contacts];

    const stories = await Story.find({
      userId: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', '_id name avatarUrl')
      .populate('viewedBy', '_id name avatarUrl')
      .sort({ createdAt: 1 });

    const groupedMap: { [key: string]: any } = {};

    stories.forEach((story: any) => {
      const uId = story.userId._id.toString();
      if (!groupedMap[uId]) {
        groupedMap[uId] = {
          user: story.userId,
          stories: [],
          hasUnviewed: false,
        };
      }
      groupedMap[uId].stories.push(story);
      const isViewedByMe = story.viewedBy.some(
        (viewer: any) => viewer._id.toString() === currentUserId
      );
      if (!isViewedByMe) {
        groupedMap[uId].hasUnviewed = true;
      }
    });

    return res.status(200).json({ storyGroups: Object.values(groupedMap) });
  } catch (error: any) {
    console.error('Get active stories error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
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

    if (currentUserId && !story.viewedBy.includes(currentUserId as any)) {
      story.viewedBy.push(currentUserId as any);
      await story.save();
    }

    return res.status(200).json({ message: 'Story marked as viewed.' });
  } catch (error: any) {
    console.error('View story error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/stories/:storyId/viewers
export const getStoryViewers = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId).populate('viewedBy', '_id name avatarUrl');

    if (!story) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    return res.status(200).json({ viewers: story.viewedBy });
  } catch (error: any) {
    console.error('Get story viewers error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
