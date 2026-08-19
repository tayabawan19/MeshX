import { Router } from 'express';
import {
  getCurrentUser,

  searchUser,
  addContact,
  getContacts,
  inviteUser,
  updateProfile,
  updatePrivacy,
  blockUser,
  unblockUser,
  blockUserByParam,
  unblockUserByParam,
  getBlockedUsers,
  deleteAccount,
  updateFcmToken,
  updateKeys,
  getUserKeys,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/me', getCurrentUser as any);
router.get('/search', searchUser as any);

router.post('/keys', updateKeys as any);
router.get('/:userId/keys', getUserKeys as any);

router.post('/add-contact', addContact as any);
router.get('/contacts', getContacts as any);
router.post('/invite', inviteUser as any);
router.put('/profile', updateProfile as any);
router.patch('/me', updateProfile as any);
router.patch('/privacy', updatePrivacy as any);
router.get('/blocked', getBlockedUsers as any);
router.post('/block', blockUser as any);
router.post('/unblock', unblockUser as any);
router.post('/block/:userId', blockUserByParam as any);
router.delete('/block/:userId', unblockUserByParam as any);
router.delete('/me', deleteAccount as any);
router.post('/fcm-token', updateFcmToken as any);

export default router;
