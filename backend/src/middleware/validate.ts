import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errorMessages = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({ error: errorMessages, details: err.issues });
      }
      return res.status(400).json({ error: 'Invalid request data.' });
    }
  };
};

// ---------------------------------------------------------------------------
// Predefined Validation Schemas
// ---------------------------------------------------------------------------

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/\d/, 'Password must contain at least one digit'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain numbers only'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/\d/, 'Password must contain at least one digit'),
});

export const sendMessageSchema = z.object({
  text: z.string().max(5000, 'Message text exceeds 5000 character limit').optional().default(''),
  type: z.enum(['text', 'image', 'voice', 'document', 'system']).optional().default('text'),
  mediaUrl: z.string().url('Invalid media URL').optional().or(z.literal('')),
  replyTo: z.string().optional().nullable(),
  storyReply: z.any().optional(),
  isForwarded: z.boolean().optional(),
  forwardCount: z.number().optional(),
  expiresAt: z.string().optional(),
});
