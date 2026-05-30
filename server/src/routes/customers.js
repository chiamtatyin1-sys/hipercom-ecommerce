import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role && role !== 'all') where.role = role;
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          wallet: true,
          referralCode: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              reviews: true,
              wishlists: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await prisma.order.findMany({
          where: { userId: customer.id, paymentStatus: 'paid' },
          select: { total: true },
        });
        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        const lastOrder = await prisma.order.findFirst({
          where: { userId: customer.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, orderNumber: true },
        });

        return {
          ...customer,
          totalSpent: parseFloat(totalSpent.toFixed(2)),
          orderCount: customer._count.orders,
          lastOrder: lastOrder,
        };
      })
    );

    res.json({
      customers: customersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        wallet: true,
        referralCode: true,
        createdAt: true,
        addresses: true,
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const [orders, reviews, referrals] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.params.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { items: { include: { product: { select: { name: true } } } } },
      }),
      prisma.review.findMany({
        where: { userId: req.params.id },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.findMany({
        where: { referrerId: req.params.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({ customer, orders, reviews, referrals });
  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({ error: 'Failed to get customer details' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, isActive, wallet } = req.body;
    const customer = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(wallet !== undefined && { wallet: parseFloat(wallet) }),
      },
    });
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
