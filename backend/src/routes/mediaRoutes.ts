import { Router } from 'express';
import multer from 'multer';
import { uploadMediaFile } from '../controllers/mediaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', authenticateToken as any, upload.single('file'), uploadMediaFile as any);

export default router;
