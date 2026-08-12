import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Strict limiter specifically on signup, resend-otp, forgot-password (3 req/15min)
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP/signup requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard auth limiter for login & verify (20 req/15min)
const standardAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', strictAuthLimiter, signup);
router.post('/verify-otp', standardAuthLimiter, verifyOtp);
router.post('/resend-otp', strictAuthLimiter, resendOtp);
router.post('/login', standardAuthLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateToken as any, logout);
router.post('/forgot-password', strictAuthLimiter, forgotPassword);
router.post('/reset-password', standardAuthLimiter, resetPassword);
router.get('/me', authenticateToken as any, getMe as any);

export default router;
