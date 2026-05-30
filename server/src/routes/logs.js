import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getLogs, getErrorLogs, clearLogs, getLogStats } from '../services/logger.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { level, limit = 50, page = 1, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = getLogs({
      level,
      limit: parseInt(limit),
      offset,
      search,
    });

    res.json({
      ...result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

router.get('/errors', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = getErrorLogs({
      limit: parseInt(limit),
      offset,
    });

    res.json({
      ...result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    res.status(500).json({ error: 'Failed to get error logs' });
  }
});

router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = getLogStats();
    res.json(stats);
  } catch (error) {
    console.error('Get log stats error:', error);
    res.status(500).json({ error: 'Failed to get log stats' });
  }
});

router.post('/clear', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = clearLogs();
    res.json(result);
  } catch (error) {
    console.error('Clear logs error:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router;
