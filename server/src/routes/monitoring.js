/**
 * Monitoring Routes
 * Real-time system health and metrics
 */

import express from 'express';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { devLogger } from '../services/devLogger.js';
import { backupManager } from '../services/backupManager.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GET /api/monitoring/health
 * Comprehensive health check
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    
    // System metrics
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      },
      load: os.loadavg(),
    },
    
    // Database status
    database: {
      status: 'unknown',
      size: null,
      tables: null,
    },
    
    // Service status
    services: {
      email: process.env.EMAIL_USER ? 'configured' : 'not-configured',
      hitpay: process.env.HITPAY_API_KEY ? 'configured' : 'not-configured',
      ai: process.env.OPENROUTER_API_KEY ? 'configured' : 'not-configured',
    },
    
    // Performance metrics
    performance: {
      memoryUsage: process.memoryUsage(),
      activeConnections: 0, // Would need to track this
    },
  };

  // Check database
  try {
    const dbHealth = await prisma.$queryRaw`SELECT 1 as test`;
    health.database.status = 'connected';
    
    // Get database size
    const dbPath = path.join(__dirname, '../../dev.db');
    if (fs.existsSync(dbPath)) {
      health.database.size = fs.statSync(dbPath).size;
    }
    
    // Get table counts
    const tableCounts = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.brand.count(),
    ]);
    
    health.database.tables = {
      users: tableCounts[0],
      products: tableCounts[1],
      orders: tableCounts[2],
      brands: tableCounts[3],
    };
  } catch (error) {
    health.database.status = 'error';
    health.database.error = error.message;
    health.status = 'unhealthy';
    devLogger.error(`Database health check failed: ${error.message}`);
  }

  // Determine overall status
  if (health.database.status === 'error') {
    health.status = 'unhealthy';
  } else if (health.system.memory.usagePercent > 90) {
    health.status = 'warning';
  }

  res.json(health);
});

/**
 * GET /api/monitoring/logs
 * Get recent logs
 */
router.get('/logs', (req, res) => {
  const { count = 100, level = null } = req.query;
  const logs = devLogger.getLogs(parseInt(count), level);
  res.json(logs);
});

/**
 * GET /api/monitoring/stats
 * Get log statistics
 */
router.get('/stats', (req, res) => {
  const stats = devLogger.getStats();
  res.json(stats);
});

/**
 * POST /api/monitoring/logs/level
 * Set log level
 */
router.post('/logs/level', authenticate, authorize('admin'), (req, res) => {
  const { level } = req.body;
  const success = devLogger.setLevel(level);
  
  if (success) {
    res.json({ success: true, level });
  } else {
    res.status(400).json({ success: false, error: 'Invalid log level' });
  }
});

/**
 * GET /api/monitoring/backups
 * List backups
 */
router.get('/backups', (req, res) => {
  const backups = backupManager.listBackups();
  res.json(backups);
});

/**
 * POST /api/monitoring/backups
 * Create backup
 */
router.post('/backups', authenticate, authorize('admin'), async (req, res) => {
  const { mode = 'manual', description = '' } = req.body;
  
  try {
    const backup = await backupManager.createBackup(mode, description);
    res.json({ success: true, backup });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/monitoring/backups/:name/restore
 * Restore from backup
 */
router.post('/backups/:name/restore', authenticate, authorize('admin'), async (req, res) => {
  const { name } = req.params;
  
  try {
    const result = await backupManager.restoreBackup(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/monitoring/backups/:name
 * Delete backup
 */
router.delete('/backups/:name', authenticate, authorize('admin'), async (req, res) => {
  const { name } = req.params;
  
  try {
    await backupManager.deleteBackup(name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get performance metrics
 */
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: {
      load: os.loadavg(),
      cpus: os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
      })),
    },
    network: {
      interfaces: os.networkInterfaces(),
    },
  };
  
  res.json(metrics);
});

export default router;
