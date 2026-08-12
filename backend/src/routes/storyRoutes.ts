import { Router } from 'express';
import {
  createStory,
  getStoriesFeed,
  getMyStories,
  viewStory,
  deleteStory,
} from '../controllers/storyController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

router.post('/', createStory as any);
router.get('/feed', getStoriesFeed as any);
router.get('/mine', getMyStories as any);
router.post('/:storyId/view', viewStory as any);
router.delete('/:storyId', deleteStory as any);

export default router;
