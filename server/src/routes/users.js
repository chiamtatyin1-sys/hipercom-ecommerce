import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import { authenticate, authorize, generateReferralCode } from '../middleware/auth.js';
import { validateUser, validatePagination } from '../middleware/validate.js';

const router = express.Router();

// Create new user (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { username, email, password, phone, role = 'customer' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
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

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const userReferralCode = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashedPassword,
        role,
        referralCode: userReferralCode,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        referralCode: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          referralCode: true,
          wallet: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        referralCode: true,
        wallet: true,
        isActive: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, role, isActive } = req.body;

    // Users can update their own profile, admins can update anyone
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role && req.user.role === 'admin') updateData.role = role;
    if (typeof isActive === 'boolean' && req.user.role === 'admin') updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.put('/:id/password', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot change other users password' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If not admin, verify current password
    if (req.user.role !== 'admin') {
      if (!user.password) {
        return res.status(400).json({ error: 'Please login with Google' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'User deactivated' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

router.get('/:id/wallet', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { wallet: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ wallet: user.wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

export default router;