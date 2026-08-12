import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { uploadMedia } from '../services/mediaService';

export const uploadMediaFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { mimetype, size, buffer } = req.file;

    let category: 'image' | 'voice' | 'document' = 'image';

    if (mimetype.startsWith('image/')) {
      category = 'image';
      if (size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image size exceeds maximum limit of 10MB.' });
      }
    } else if (
      mimetype.startsWith('audio/') ||
      mimetype === 'application/octet-stream' ||
      mimetype.includes('m4a') ||
      mimetype.includes('mp4')
    ) {
      category = 'voice';
      if (size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Voice note size exceeds maximum limit of 5MB.' });
      }
    } else {
      category = 'document';
      if (size > 20 * 1024 * 1024) {
        return res.status(400).json({ error: 'Document size exceeds maximum limit of 20MB.' });
      }
    }

    const result = await uploadMedia(buffer, mimetype, category);

    return res.status(200).json({
      mediaUrl: result.mediaUrl,
      mediaType: result.mediaType,
    });
  } catch (error: any) {
    console.error('[Media Upload Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to upload media file.' });
  }
};
