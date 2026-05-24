import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService, UserSchema } from '../services/db';

const JWT_SECRET = process.env.JWT_SECRET || 'f1-app-secret-key-2025';

export interface AuthenticatedRequest extends Request {
  user?: Omit<UserSchema, 'hashedPassword'>;
}

/**
 * Middleware to require JWT Authentication
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Extract token from Authorization header or Cookies
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing. Please sign in.',
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication session.',
      });
    }

    // 3. Find user in the database
    const user = await DatabaseService.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Session user does not exist.',
      });
    }

    // 4. Attach user data to request context (omit password for security)
    const { hashedPassword, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR] JWT verification failed:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please sign in again.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed. Please sign in again.',
    });
  }
}

/**
 * Middleware to require verified email accounts
 */
export function requireVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required. Please check your inbox.',
      code: 'EMAIL_UNVERIFIED'
    });
  }

  next();
}
