import { Router } from 'express';
import {
  createStory,
  getActiveStories,
  viewStory,
  getStoryViewers,
} from '../controllers/storyController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

router.post('/', createStory as any);
router.get('/', getActiveStories as any);
router.post('/:storyId/view', viewStory as any);
router.get('/:storyId/viewers', getStoryViewers as any);

export default router;
