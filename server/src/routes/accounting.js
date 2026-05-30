import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Seller data isolation
    const isSeller = req.user.role === 'seller';
    const sellerProductFilter = isSeller ? { items: { some: { product: { userId: req.user.id } } } } : {};
    const sellerProductWhere = isSeller ? { userId: req.user.id } : {};
    const sellerTransactionFilter = isSeller ? {
      OR: [
        { orderId: { in: (await prisma.order.findMany({ where: { items: { some: { product: { userId: req.user.id } } } }, select: { id: true } })).map(o => o.id) } },
        { type: 'expense' },
      ]
    } : {};

    const [
      todayOrders,
      weekOrders,
      monthOrders,
      totalRevenue,
      totalExpenses,
      lowStockProducts,
      recentTransactions,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { ...sellerProductFilter, createdAt: { gte: today }, paymentStatus: 'paid' },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: { ...sellerProductFilter, createdAt: { gte: weekAgo }, paymentStatus: 'paid' },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: { ...sellerProductFilter, createdAt: { gte: monthAgo }, paymentStatus: 'paid' },
        select: { total: true },
      }),
      prisma.transaction.aggregate({
        where: { ...sellerTransactionFilter, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...sellerTransactionFilter, type: 'expense' },
        _sum: { amount: true },
      }),
      prisma.product.findMany({
        where: {
          ...sellerProductWhere,
          isActive: true,
          stock: { lte: prisma.product.fields.lowStockAlert },
        },
        take: 10,
        select: { id: true, name: true, stock: true, lowStockAlert: true },
      }),
      prisma.transaction.findMany({
        where: sellerTransactionFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate inventory valuation
    const products = await prisma.product.findMany({
      where: { ...sellerProductWhere, isActive: true },
      select: { stock: true, costPrice: true },
    });

    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

    res.json({
      todaySales: todayOrders.reduce((sum, o) => sum + o.total, 0),
      weekSales: weekOrders.reduce((sum, o) => sum + o.total, 0),
      monthSales: monthOrders.reduce((sum, o) => sum + o.total, 0),
      totalRevenue: totalRevenue._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      profit: (totalRevenue._sum.amount || 0) - (totalExpenses._sum.amount || 0),
      inventoryValue,
      lowStockProducts,
      recentTransactions,
      orderCount: {
        today: todayOrders.length,
        week: weekOrders.length,
        month: monthOrders.length,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

router.get('/transactions', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { page = 1, limit = 50, type, category, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Seller data isolation
    if (req.user.role === 'seller') {
      const sellerOrderIds = (await prisma.order.findMany({
        where: { items: { some: { product: { userId: req.user.id } } } },
        select: { id: true },
      })).map(o => o.id);
      where.OR = [
        { orderId: { in: sellerOrderIds } },
        { type: 'expense' },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

router.get('/expenses', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, category, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    const totalAmount = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    res.json({
      expenses,
      totalAmount: totalAmount._sum.amount || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

router.post('/expenses', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (!isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parsedAmount,
        description: description || '',
        date: date ? new Date(date) : new Date(),
      },
    });

    await prisma.transaction.create({
      data: {
        type: 'expense',
        category: `expense_${category}`,
        amount: parsedAmount,
        description: description || `Expense: ${category}`,
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.put('/expenses/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : undefined,
      },
    });

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/expenses/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

router.get('/reports/sales', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where = { paymentStatus: 'paid' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Seller data isolation
    if (req.user.role === 'seller') {
      where.items = { some: { product: { userId: req.user.id } } };
    }

    const orders = await prisma.order.findMany({
      where,
      include: req.user.role === 'seller' ? { items: { include: { product: { select: { userId: true } } } } } : {},
      select: { createdAt: true, total: true, subtotal: true, tax: true, shippingCost: true, items: req.user.role === 'seller' },
    });

    // Group by day/week/month
    const grouped = {};
    for (const order of orders) {
      let key;
      const date = new Date(order.createdAt);
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, orders: 0, tax: 0, shipping: 0 };
      }
      grouped[key].revenue += order.total;
      grouped[key].orders += 1;
      grouped[key].tax += order.tax;
      grouped[key].shipping += order.shippingCost;
    }

    res.json(Object.entries(grouped).map(([date, data]) => ({
      date,
      ...data,
    })));
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

router.get('/reports/products', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    const where = { paymentStatus: 'paid' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Seller data isolation
    if (req.user.role === 'seller') {
      where.items = { some: { product: { userId: req.user.id } } };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: { select: { id: true, name: true, costPrice: true, userId: true } } },
        },
      },
    });

    const productStats = {};
    for (const order of orders) {
      for (const item of order.items) {
        // Skip products not owned by seller
        if (req.user.role === 'seller' && item.product.userId !== req.user.id) continue;

        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0,
            cost: (item.product.costPrice || 0) * item.quantity,
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.price * item.quantity;
        productStats[item.productId].cost += (item.product.costPrice || 0) * item.quantity;
      }
    }

    const sorted = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit))
      .map(p => ({
        ...p,
        profit: p.revenue - p.cost,
        margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100).toFixed(2) : 0,
      }));

    res.json(sorted);
  } catch (error) {
    console.error('Product report error:', error);
    res.status(500).json({ error: 'Failed to generate product report' });
  }
});

router.get('/reports/inventory', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const where = { isActive: true };

    // Seller data isolation
    if (req.user.role === 'seller') {
      where.userId = req.user.id;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        costPrice: true,
        price: true,
        lowStockAlert: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });

    const inventory = products.map(p => ({
      ...p,
      value: p.stock * p.costPrice,
      potentialRevenue: p.stock * p.price,
      status: p.stock === 0 ? 'out_of_stock' : p.stock <= p.lowStockAlert ? 'low_stock' : 'in_stock',
    }));

    const summary = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      totalValue: inventory.reduce((sum, p) => sum + p.value, 0),
      potentialRevenue: inventory.reduce((sum, p) => sum + p.potentialRevenue, 0),
      outOfStock: inventory.filter(p => p.status === 'out_of_stock').length,
      lowStock: inventory.filter(p => p.status === 'low_stock').length,
    };

    res.json({ inventory, summary });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
});

export default router;