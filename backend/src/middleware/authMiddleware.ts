import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'everchat_jwt_secret_key_2026_super_secure';

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    req.user = decoded;
    next();
  });
};

export const requireAuth = authenticateToken;

