import { Router } from 'express';
import {
  getChats,
  getArchivedChats,
  toggleArchiveChat,
  createOrGetDirectChat,
  createGroupChat,
  getMessages,
  sendMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
  editMessage,
  forwardMessages,
  getMessageInfo,
  promoteDemoteAdmin,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  updateGroupSettings,
  updateGroupInfo,
  getGroupInviteLink,
  joinGroupByInviteCode,
  updateChatTheme,
  updateChatWallpaper,
  toggleMuteChat,
  updateDisappearingMessages,
  markChatRead,
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

// Chat listing & Archiving
router.get('/', getChats as any);
router.get('/archived', getArchivedChats as any);
router.patch('/:chatId/archive', toggleArchiveChat as any);

// Chat Creation
router.post('/direct', createOrGetDirectChat as any);
router.post('/group', createGroupChat as any);

import { validate, sendMessageSchema } from '../middleware/validate';

// Messages
router.get('/:chatId/messages', getMessages as any);
router.post('/:chatId/messages', validate(sendMessageSchema), sendMessage as any);
router.delete('/:chatId/messages/:messageId/everyone', deleteMessageForEveryone as any);
router.delete('/:chatId/messages/:messageId/me', deleteMessageForMe as any);
router.patch('/:chatId/messages/:messageId', editMessage as any);
router.post('/forward', forwardMessages as any);
router.get('/:chatId/messages/:messageId/info', getMessageInfo as any);
router.post('/:chatId/read', markChatRead as any);

// Group Management
router.post('/:chatId/group/admins', promoteDemoteAdmin as any);
router.post('/:chatId/group/members', addGroupMembers as any);
router.delete('/:chatId/group/members/:memberId', removeGroupMember as any);
router.post('/:chatId/group/leave', leaveGroup as any);
router.patch('/:chatId/group/settings', updateGroupSettings as any);
router.patch('/:chatId/group/info', updateGroupInfo as any);
router.post('/:chatId/invite-link', getGroupInviteLink as any);
router.post('/join/:inviteCode', joinGroupByInviteCode as any);

// Compatibility aliases
router.post('/:chatId/leave', leaveGroup as any);
router.patch('/:chatId/group-info', updateGroupInfo as any);
router.patch('/:chatId/settings', updateGroupSettings as any);
router.post('/:chatId/members', addGroupMembers as any);
router.delete('/:chatId/members/:memberId', removeGroupMember as any);

// Themes & Settings
router.put('/:chatId/theme', updateChatTheme as any);
router.patch('/:chatId/theme', updateChatTheme as any);
router.patch('/:chatId/wallpaper', updateChatWallpaper as any);
router.patch('/:chatId/mute', toggleMuteChat as any);
router.patch('/:chatId/disappearing', updateDisappearingMessages as any);

export default router;
