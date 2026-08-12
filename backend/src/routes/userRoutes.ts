import { Router } from 'express';
import {
  searchUser,
  addContact,
  getContacts,
  inviteUser,
  updateProfile,
  blockUser,
  unblockUser,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/search', searchUser as any);
router.post('/add-contact', addContact as any);
router.get('/contacts', getContacts as any);
router.post('/invite', inviteUser as any);
router.put('/profile', updateProfile as any);
router.post('/block', blockUser as any);
router.post('/unblock', unblockUser as any);

export default router;
