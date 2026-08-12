import { Router } from 'express';
import {
  getChats,
  createOrGetDirectChat,
  createGroupChat,
  getMessages,
  sendMessage,
  updateChatTheme,
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getChats as any);
router.post('/direct', createOrGetDirectChat as any);
router.post('/group', createGroupChat as any);
router.get('/:chatId/messages', getMessages as any);
router.post('/:chatId/messages', sendMessage as any);
router.put('/:chatId/theme', updateChatTheme as any);

export default router;
