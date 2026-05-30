import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, entity, action } = req.query;
    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [totalLogs, entityBreakdown, actionBreakdown, recentActivity] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({ by: ['entity'], _count: true, orderBy: { _count: { entity: 'desc' } } }),
      prisma.auditLog.groupBy({ by: ['action'], _count: true, orderBy: { _count: { action: 'desc' } } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    res.json({
      totalLogs,
      entityBreakdown,
      actionBreakdown,
      recentActivity,
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit stats' });
  }
});

export default router;
