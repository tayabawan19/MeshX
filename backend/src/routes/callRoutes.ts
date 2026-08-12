import { Router } from 'express';
import { getCallHistory, createCallLog, generateAgoraToken } from '../controllers/callController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getCallHistory as any);
router.post('/', createCallLog as any);
router.post('/token', generateAgoraToken as any);

export default router;
