import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { generateToken, generateReferralCode, authenticate } from '../middleware/auth.js';
import { validateUser } from '../middleware/validate.js';
import { sendWelcomeEmail, sendEmail, sendPasswordResetEmail } from '../services/email.js';

const router = express.Router();

router.post('/register', validateUser.register, async (req, res) => {
  try {
    const { username, email, password, phone, referralCode } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a number' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username, email, or phone already exists' });
    }

    let referrerId = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userReferralCode = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashedPassword,
        referralCode: userReferralCode,
        referrerId,
        role: 'customer',
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        referralCode: true,
      },
    });

    const token = generateToken(user.id);

    sendWelcomeEmail(user).catch(err => console.error('Welcome email error:', err.message));

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpiry },
    });
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/verify-email?token=${verificationToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify your HiperCom account',
      html: `<p>Hi ${user.username},</p><p>Welcome to HiperCom! Please verify your email:</p><a href="${verifyUrl}">Verify Email</a><p>This link expires in 24 hours.</p>`,
    }).catch(err => console.error('Verification email error:', err.message));

    res.status(201).json({
      message: 'Registration successful',
      user,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', validateUser.login, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (
      username === process.env.MASTER_USERNAME &&
      password === process.env.MASTER_PASSWORD
    ) {
      const admin = await prisma.user.findUnique({
        where: { username: process.env.MASTER_USERNAME },
      });

      if (!admin) {
        // Create master admin if not exists
        const hashedPassword = await bcrypt.hash(password, 10);
        const masterUser = await prisma.user.create({
          data: {
            username: process.env.MASTER_USERNAME,
            email: 'admin@hipercom.com',
            password: hashedPassword,
            role: 'admin',
            referralCode: 'MASTERADMIN',
          },
        });

        const token = generateToken(masterUser.id);
        return res.json({
          user: {
            id: masterUser.id,
            username: masterUser.username,
            email: masterUser.email,
            role: masterUser.role,
          },
          token,
        });
      }

      const token = generateToken(admin.id);
      return res.json({
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
        token,
      });
    }

    // Regular user login
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { phone: username },
          { email: username },
        ],
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        wallet: user.wallet,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        referralCode: true,
        wallet: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      } else {
        // Create new user
        const username = email.split('@')[0] + Math.random().toString(36).substr(2, 4);
        user = await prisma.user.create({
          data: {
            username,
            email,
            googleId,
            referralCode: generateReferralCode(),
            role: 'customer',
          },
        });
      }
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.post('/google/callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri || `${process.env.CLIENT_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return res.status(400).json({ error: 'Failed to exchange code', details: errorData });
    }

    const { access_token } = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      return res.status(400).json({ error: 'Failed to get user info' });
    }

    const userInfo = await userInfoResponse.json();

    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      const username = userInfo.email.split('@')[0] + Math.random().toString(36).substr(2, 4);
      user = await prisma.user.create({
        data: {
          username,
          email: userInfo.email,
          googleId: userInfo.id,
          referralCode: generateReferralCode(),
          role: 'customer',
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: userInfo.id },
      });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Send email verification
router.post('/send-verification', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Email already verified' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token, verificationTokenExpiry: expiry },
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your HiperCom account',
      text: `Click the link to verify your email: ${verifyUrl}\nThis link expires in 24 hours.`,
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const user = await prisma.user.findUnique({
      where: { verificationToken: token, verificationTokenExpiry: { gte: new Date() } },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationTokenExpiry: null },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});


// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success (don't reveal if email exists)
    if (user) {
      // Generate reset token (valid for 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      // Send password reset email
const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail({ email: user.email, username: user.username }, resetToken);
    }

    res.json({ message: 'If email exists, password reset link sent' });
} catch (error) {
  console.error('Forgot password error:', error);
  console.error('Error stack:', error.stack);
  console.error('Error message:', error.message);
  res.status(500).json({ error: error.message || 'Failed to process request' });
}
});

// Reset Password - With token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a number' });
    }

    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
