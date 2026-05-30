import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const orders = await prisma.order.findMany({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      include: {
        items: { include: { product: { select: { name: true, categoryId: true } } } },
        coupon: true,
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0;

    const statusCounts = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const revenueByDay = {};
    orders.forEach(o => {
      const day = o.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + o.total;
    });
    const revenueTrend = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));

    const productSales = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const name = item.product?.name || 'Unknown';
        if (!productSales[name]) productSales[name] = { name, quantity: 0, revenue: 0 };
        productSales[name].quantity += item.quantity;
        productSales[name].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const couponUsage = {};
    orders.forEach(o => {
      if (o.coupon) {
        const code = o.coupon.code;
        if (!couponUsage[code]) couponUsage[code] = { code, count: 0, totalDiscount: 0 };
        couponUsage[code].count++;
        couponUsage[code].totalDiscount += o.discount;
      }
    });

    const recentOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        itemCount: o.items.length,
      }));

    const today = new Date();
    const thisMonth = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const monthlyRevenue = thisMonth.reduce((sum, o) => sum + o.total, 0);

    res.json({
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(1)),
      },
      statusCounts,
      revenueTrend,
      topProducts,
      couponUsage: Object.values(couponUsage),
      recentOrders,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;
