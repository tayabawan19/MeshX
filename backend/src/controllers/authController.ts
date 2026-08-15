import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import OtpToken from '../models/OtpToken';
import RefreshToken from '../models/RefreshToken';
import { sendOtpEmail } from '../services/emailService';
import { AuthRequest } from '../middleware/authMiddleware';

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'everchat_jwt_secret_key_2026_super_secure';
};

const getJwtRefreshSecret = (): string => {
  return process.env.JWT_REFRESH_SECRET || 'everchat_jwt_refresh_secret_key_2026';
};

const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

const validatePassword = (password: string): boolean => {
  const regex = /^(?=.*[0-9]).{8,}$/;
  return regex.test(password);
};

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const issueTokensAndSave = async (userId: string, email: string, deviceInfo?: string) => {
  const JWT_SECRET = getJwtSecret();
  const JWT_REFRESH_SECRET = getJwtRefreshSecret();

  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, email }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    deviceInfo: deviceInfo || 'Mobile Device',
  });

  return { accessToken, refreshToken };
};

// POST /api/auth/signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      console.error('[Signup Validation Error] Missing required fields:', {
        name: !!name,
        email: !!email,
        phone: !!phone,
        password: !!password,
      });
      return res.status(400).json({ error: 'All fields (name, email, phone, password) are required.' });
    }

    if (!validatePassword(password)) {
      console.error('[Signup Validation Error] Password does not meet security requirements.');
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one number.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check rate limit: max 3 OTP requests per 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentOtpsCount = await OtpToken.countDocuments({
      email: cleanEmail,
      createdAt: { $gte: fifteenMinsAgo },
    });

    if (recentOtpsCount >= 3) {
      console.error('[Signup Rate Limit] Exceeded 3 OTP requests in 15m for:', cleanEmail);
      return res.status(429).json({
        error: 'Too many OTP requests. Please wait 15 minutes before trying again.',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });

    if (existingUser && existingUser.isVerified) {
      const matchField = existingUser.email === cleanEmail ? 'email' : 'phone number';
      console.error(`[Signup Validation Error] A user with this ${matchField} already exists:`, cleanEmail);
      return res.status(400).json({ error: `A user with this ${matchField} already exists.` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user = existingUser;
    if (!user) {
      user = new User({
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        isVerified: false,
      });
    } else {
      console.log('[Signup Resume] Unverified account found. Resuming signup & refreshing credentials for:', cleanEmail);
      user.name = name.trim();
      user.phone = cleanPhone;
      user.passwordHash = passwordHash;
    }
    await user.save();

    await OtpToken.deleteMany({ email: cleanEmail });

    // Generate 6-digit cryptographically secure OTP
    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await OtpToken.create({
      userId: user._id,
      email: cleanEmail,
      otpHash,
      purpose: 'signup',
      expiresAt,
      attempts: 0,
    });

    await sendOtpEmail(cleanEmail, otpCode, user.name);

    return res.status(201).json({
      message: existingUser ? 'Unverified account resumed. Check your email for the 6-digit OTP code.' : 'Signup initiated. Please check your email for the 6-digit OTP code.',
      email: cleanEmail,
      isResumed: !!existingUser,
    });
  } catch (error: any) {
    console.error('[Signup Server Error] Error during signup process:', error.stack || error);
    return res.status(500).json({ error: error.message || 'Internal server error during signup.' });
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpDoc = await OtpToken.findOne({ email: cleanEmail }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ error: 'OTP code expired or not found. Please request a new code.' });
    }

    if (otpDoc.attempts >= 5) {
      return res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP code.' });
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = 5 - otpDoc.attempts;
      return res.status(400).json({
        error: remaining > 0
          ? `Invalid OTP code. ${remaining} attempts remaining.`
          : 'Maximum verification attempts exceeded. Please request a new OTP code.',
      });
    }

    const user = await User.findById(otpDoc.userId);
    if (!user) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    user.isVerified = true;
    await user.save();

    await OtpToken.deleteMany({ userId: user._id });

    // Issue Access & Refresh Tokens and record RefreshToken in DB
    const deviceInfo = (req.headers['user-agent'] as string) || 'Mobile Device';
    const { accessToken, refreshToken } = await issueTokensAndSave(user._id.toString(), user.email, deviceInfo);

    return res.status(200).json({
      message: 'OTP verified successfully.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Internal server error verifying OTP.' });
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found with this email.' });
    }

    // Rate limit check: max 3 per 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentOtpsCount = await OtpToken.countDocuments({
      email: cleanEmail,
      createdAt: { $gte: fifteenMinsAgo },
    });

    if (recentOtpsCount >= 3) {
      return res.status(429).json({ error: 'Too many OTP requests. Please wait 15 minutes before requesting again.' });
    }

    await OtpToken.deleteMany({ email: cleanEmail });

    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpToken.create({
      userId: user._id,
      email: cleanEmail,
      otpHash,
      purpose: 'signup',
      expiresAt,
      attempts: 0,
    });

    await sendOtpEmail(cleanEmail, otpCode, user.name);

    return res.status(200).json({ message: 'New OTP sent to your email.' });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ error: 'Internal server error resending OTP.' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      console.log('[Login Attempt] No account found with email:', cleanEmail);
      return res.status(401).json({ error: 'No account found with this email' });
    }

    if (!user.isVerified) {
      console.log('[Login Attempt] User account unverified for email:', cleanEmail);
      return res.status(401).json({
        error: 'Please verify your email first',
        isVerified: false,
        email: cleanEmail,
      });
    }

    if (!user.passwordHash) {
      console.log('[Login Attempt] User has no passwordHash set for email:', cleanEmail);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('[Login Attempt] Incorrect password for email:', cleanEmail);
      return res.status(401).json({ error: 'Incorrect password' });
    }

    console.log('[Login Attempt] Login successful for email:', cleanEmail);

    const deviceInfo = (req.headers['user-agent'] as string) || 'Mobile Device';
    const { accessToken, refreshToken } = await issueTokensAndSave(user._id.toString(), user.email, deviceInfo);

    return res.status(200).json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Internal server error during login.' });
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const JWT_REFRESH_SECRET = getJwtRefreshSecret();

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const tokenHash = hashToken(token);

    // Verify token exists in database and delete old token (rotate)
    const existingSession = await RefreshToken.findOneAndDelete({
      userId: decoded.userId,
      tokenHash,
    });

    if (!existingSession) {
      return res.status(401).json({ error: 'Refresh token has been revoked or is invalid.' });
    }

    const deviceInfo = (req.headers['user-agent'] as string) || existingSession.deviceInfo || 'Mobile Device';
    const newTokens = await issueTokensAndSave(decoded.userId, decoded.email, deviceInfo);

    return res.status(200).json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      const tokenHash = hashToken(token);
      await RefreshToken.deleteOne({ tokenHash });
    } else if ((req as AuthRequest).user?.userId) {
      const userId = (req as AuthRequest).user?.userId;
      await RefreshToken.deleteMany({ userId });
    }

    return res.status(200).json({ message: 'Logged out successfully. Session revoked.' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error during logout.' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(200).json({ message: 'If an account exists with that email, a password reset code has been sent.' });
    }

    // Rate limit check: max 3 per 15 mins
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentOtpsCount = await OtpToken.countDocuments({
      email: cleanEmail,
      createdAt: { $gte: fifteenMinsAgo },
    });

    if (recentOtpsCount >= 3) {
      return res.status(429).json({ error: 'Too many reset requests. Please wait 15 minutes before requesting again.' });
    }

    await OtpToken.deleteMany({ email: cleanEmail, purpose: 'reset' });

    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpToken.create({
      userId: user._id,
      email: cleanEmail,
      otpHash,
      purpose: 'reset',
      expiresAt,
      attempts: 0,
    });

    console.log(`\n==================================================`);
    console.log(`[Brevo Email Service] Password Reset OTP for ${cleanEmail}: ${otpCode}`);
    console.log(`==================================================\n`);

    await sendOtpEmail(cleanEmail, otpCode, user.name);

    return res.status(200).json({ message: 'Password reset OTP code sent to your email.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long and contain at least one number.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpDoc = await OtpToken.findOne({ email: cleanEmail, purpose: 'reset' }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ error: 'OTP code expired or invalid. Please request a new code.' });
    }

    if (otpDoc.attempts >= 5) {
      return res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP code.' });
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    const user = await User.findById(otpDoc.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Revoke ALL refresh tokens for this user upon password reset (force re-login everywhere)
    await RefreshToken.deleteMany({ userId: user._id });
    await OtpToken.deleteMany({ userId: user._id });

    return res.status(200).json({ message: 'Password successfully reset. All active sessions have been revoked. Please log in.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    console.error('Get Me error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
