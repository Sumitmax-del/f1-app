import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../services/db';
import { EmailService } from '../services/email';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'f1-app-secret-key-2025';

// Helper to sign JWT
function signToken(userId: string, username: string): string {
  return jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * POST /api/auth/register (or signup)
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, password, favouriteTeam, favouriteDriver } = req.body;

    // 1. Basic empty validations
    if (!fullName || !username || !email || !password || !favouriteTeam || !favouriteDriver) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields.',
      });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    // 3. Username constraints
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters long.',
      });
    }

    // 4. Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
      });
    }

    // 5. Check duplicate username or email
    const duplicateEmail = await DatabaseService.findByEmail(email);
    if (duplicateEmail) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const duplicateUsername = await DatabaseService.findByUsername(username);
    if (duplicateUsername) {
      return res.status(409).json({
        success: false,
        error: 'Username is already taken by another driver.',
      });
    }

    // 6. Secure password hashing
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Generate email verification token
    const verificationToken = uuidv4();

    // 8. Create user in database
    const newUser = await DatabaseService.create({
      fullName,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      hashedPassword,
      favouriteTeam,
      favouriteDriver,
      verificationToken,
    });

    // 9. Send verification email (non-blocking so API responds fast)
    EmailService.sendVerificationEmail(
      newUser.email,
      newUser.fullName,
      newUser.username,
      verificationToken,
      newUser.favouriteTeam
    ).catch(err => console.error('[AUTH REGISTER WARNING] Verification mail failed to dispatch:', err));

    // 10. Generate JWT token for auto-login
    const token = signToken(newUser.id, newUser.username);

    // Return safe user profile
    const { hashedPassword: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Verification email sent.',
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (error: any) {
    console.error('[AUTH REGISTER ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error occurred during registration.',
    });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in both email/username and password.',
      });
    }

    // Try finding by email first, then username
    let user = await DatabaseService.findByEmail(emailOrUsername);
    if (!user) {
      user = await DatabaseService.findByUsername(emailOrUsername);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please try again.',
      });
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please try again.',
      });
    }

    // Create session token
    const token = signToken(user.id, user.username);
    const { hashedPassword: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Successfully logged in!',
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (error: any) {
    console.error('[AUTH LOGIN ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error occurred during login.',
    });
  }
});

/**
 * GET /api/auth/verify-email
 */
router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is missing.',
      });
    }

    const user = await DatabaseService.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token.',
      });
    }

    // Mark verified and delete token
    await DatabaseService.update(user.id, {
      emailVerified: true,
      verificationToken: undefined,
    });

    return res.json({
      success: true,
      message: 'Email address verified successfully! You now have full access to F1 Live dashboard.',
    });
  } catch (error: any) {
    console.error('[AUTH VERIFY EMAIL ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error occurred during email verification.',
    });
  }
});

/**
 * POST /api/auth/resend-verification
 */
router.post('/resend-verification', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = req.user!;
    
    // Find absolute DB user record
    const user = await DatabaseService.findById(userContext.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Your email address is already verified.',
      });
    }

    // Generate new token
    const newToken = uuidv4();
    await DatabaseService.update(user.id, {
      verificationToken: newToken,
    });

    // Send email
    await EmailService.sendVerificationEmail(
      user.email,
      user.fullName,
      user.username,
      newToken,
      user.favouriteTeam
    );

    return res.json({
      success: true,
      message: 'A fresh verification link has been dispatched to your inbox.',
    });
  } catch (error: any) {
    console.error('[AUTH RESEND VERIFICATION ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error occurred while resending verification email.',
    });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * POST /api/auth/favorites
 */
router.post('/favorites', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { favoriteDriver, favoriteTeam, favouriteDriver, favouriteTeam } = req.body;
    const userContext = req.user!;

    // Resolve driver and team names support both spelling structures
    const fDriver = favouriteDriver || favoriteDriver;
    const fTeam = favouriteTeam || favoriteTeam;

    const updates: any = {};
    if (fDriver) {
      updates.favouriteDriver = fDriver;
      updates.favoriteDriver = fDriver; // Sync old field support
    }
    if (fTeam) {
      updates.favouriteTeam = fTeam;
      updates.favoriteTeam = fTeam; // Sync old field support
    }

    const updatedUser = await DatabaseService.update(userContext.id, updates);
    const { hashedPassword: _, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      message: 'Favorites updated successfully!',
      data: {
        user: safeUser,
      },
    });
  } catch (error: any) {
    console.error('[AUTH UPDATE FAVORITES ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error occurred while updating favorites.',
    });
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please specify your registered driver email address.',
      });
    }

    const user = await DatabaseService.findByEmail(email);
    if (!user) {
      // Security standard: don't reveal if account exists, say mail sent!
      console.log(`[AUTH FORGOT PASSWORD] Attempted reset for unregistered email: ${email}`);
      return res.json({
        success: true,
        message: 'A recovery link has been dispatched if this driver email is registered.',
      });
    }

    // Generate UUID token expiring in 1 hour
    const resetPasswordToken = uuidv4();
    const resetPasswordExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await DatabaseService.update(user.id, {
      resetPasswordToken,
      resetPasswordExpires,
    });

    // Send reset email (non-blocking)
    EmailService.sendResetPasswordEmail(user.email, user.fullName, resetPasswordToken)
      .catch(err => console.error('[AUTH FORGOT PASSWORD ERROR] Failed to dispatch mail:', err));

    return res.json({
      success: true,
      message: 'A recovery link has been dispatched if this driver email is registered.',
    });
  } catch (error: any) {
    console.error('[AUTH FORGOT PASSWORD ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error occurred during password recovery dispatch.',
    });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new security password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
      });
    }

    const user = await DatabaseService.findByResetToken(token);
    
    // Check if token exists and is not expired
    if (!user || !user.resetPasswordExpires || new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({
        success: false,
        error: 'The password reset token is invalid or has expired. Please run a fresh recovery request.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and wipe token columns
    await DatabaseService.update(user.id, {
      hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    return res.json({
      success: true,
      message: 'Your garage password has been reset successfully! You can now sign in.',
    });
  } catch (error: any) {
    console.error('[AUTH RESET PASSWORD ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error occurred while resetting password.',
    });
  }
});

export default router;
