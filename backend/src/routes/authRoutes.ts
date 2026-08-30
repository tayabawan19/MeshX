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
import {
  validate,
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../middleware/validate';

const router = Router();

// Strict limiter specifically on signup, resend-otp, forgot-password (5 req/15min)
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP/signup requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard auth limiter for login & verify (25 req/15min)
const standardAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', strictAuthLimiter, validate(signupSchema), signup);
router.post('/verify-otp', standardAuthLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', strictAuthLimiter, resendOtp);
router.post('/login', standardAuthLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateToken as any, logout);
router.post('/forgot-password', strictAuthLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', standardAuthLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticateToken as any, getMe as any);

export default router;
