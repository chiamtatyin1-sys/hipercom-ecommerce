/**
 * AI Command Center Routes
 * Semi-automated AI control and monitoring
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth.js';
import { devLogger } from '../services/devLogger.js';
import { backupManager } from '../services/backupManager.js';
import { migrationManager } from '../services/migrationManager.js';
import aiUploadHandler from '../services/aiUploadHandler.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(authenticate, authorize('admin'));

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/incoming/'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * GET /api/ai/status
 * Complete system status for AI monitoring
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      system: 'online',
      ai_mode: 'semi-automated',
      
      // Core services
      services: {
        backend: 'running',
        frontend: 'running',
        database: 'connected',
        email: process.env.EMAIL_USER ? 'configured' : 'not-configured',
        payments: process.env.HITPAY_API_KEY ? 'configured' : 'not-configured',
        ai_providers: process.env.OPENROUTER_API_KEY ? 'configured' : 'not-configured',
      },
      
      // Features
      features: {
        brand_logos: true,
        wishlist: false,
        coupons: false,
        reviews: false,
        sitemap: true,
        rate_limiting: true,
        error_boundary: true,
      },
      
      // Monitoring
      monitoring: {
        logging: 'active',
        backups: backupManager.listBackups().length,
        migrations: migrationManager.getStatus(),
      },
      
      // Performance
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
    
    res.json(status);
  } catch (error) {
    devLogger.error(`AI status error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/health
 * Quick health check
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'semi-automated'
  });
});

/**
 * POST /api/ai/upload
 * AI upload handler - semi-automated
 * Human uploads, AI processes and categorizes
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    
    devLogger.info(`AI processing upload: ${fileName}`);
    
    // Process with AI handler
    const result = await aiUploadHandler.handleFileUpload(filePath);
    
    res.json({
      success: true,
      file: fileName,
      result,
      message: 'File processed by AI',
    });
  } catch (error) {
    devLogger.error(`AI upload error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/migration/create
 * Create a new database migration
 */
router.post('/migration/create', async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Migration name required' });
    }
    
    const migration = await migrationManager.createMigration(name, description);
    
    res.json({
      success: true,
      migration,
      message: 'Migration created. Edit up.sql and down.sql, then run migration.',
    });
  } catch (error) {
    devLogger.error(`Migration create error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/migration/run
 * Run pending migrations
 */
router.post('/migration/run', async (req, res) => {
  try {
    const { createBackup = true } = req.body;
    const result = await migrationManager.runMigrations(createBackup);
    
    res.json({
      success: result.success,
      ...result,
    });
  } catch (error) {
    devLogger.error(`Migration run error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/migration/rollback
 * Rollback last migration
 */
router.post('/migration/rollback', async (req, res) => {
  try {
    const result = await migrationManager.rollbackLast();
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    devLogger.error(`Migration rollback error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/migrations
 * List all migrations
 */
router.get('/migrations', (req, res) => {
  const migrations = migrationManager.listMigrations();
  res.json(migrations);
});

/**
 * POST /api/ai/backup/create
 * Create backup
 */
router.post('/backup/create', async (req, res) => {
  try {
    const { mode = 'manual', description = '' } = req.body;
    const backup = await backupManager.createBackup(mode, description);
    
    res.json({
      success: true,
      backup,
    });
  } catch (error) {
    devLogger.error(`Backup create error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/backup/:name/restore
 * Restore from backup
 */
router.post('/backup/:name/restore', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await backupManager.restoreBackup(name);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    devLogger.error(`Backup restore error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/backups
 * List all backups
 */
router.get('/backups', (req, res) => {
  const backups = backupManager.listBackups();
  res.json(backups);
});

/**
 * GET /api/ai/logs
 * Get recent logs
 */
router.get('/logs', (req, res) => {
  const { count = 100, level } = req.query;
  const logs = devLogger.getLogs(parseInt(count), level);
  res.json(logs);
});

/**
 * GET /api/ai/stats
 * Get log statistics
 */
router.get('/stats', (req, res) => {
  const stats = devLogger.getStats();
  res.json(stats);
});

/**
 * POST /api/ai/set-log-level
 * Set log level
 */
router.post('/set-log-level', (req, res) => {
  const { level } = req.body;
  const success = devLogger.setLevel(level);
  res.json({ success, level: success ? level : null });
});

/**
 * GET /api/ai/instructions
 * Get AI automation instructions
 */
router.get('/instructions', (req, res) => {
  const instructions = {
    version: '1.0.0',
    mode: 'semi-automated',
    
    workflows: {
      upload_brand_logo: {
        description: 'Upload a brand logo image',
        endpoint: 'POST /api/ai/upload',
        form_data: { file: '<image_file>' },
        ai_action: 'Auto-detects as brand logo, resizes to 200x200, saves to /uploads/brands/',
      },
      
      create_migration: {
        description: 'Create database migration',
        endpoint: 'POST /api/ai/migration/create',
        body: { name: 'add_users_table', description: 'Add users' },
        ai_action: 'Creates migration files, edit up.sql/down.sql then run',
      },
      
      run_migrations: {
        description: 'Run pending migrations',
        endpoint: 'POST /api/ai/migration/run',
        body: { createBackup: true },
        ai_action: 'Applies all pending migrations with auto-backup',
      },
      
      create_backup: {
        description: 'Create database backup',
        endpoint: 'POST /api/ai/backup/create',
        body: { mode: 'manual', description: 'Before deploy' },
        ai_action: 'Creates timestamped backup with metadata',
      },
      
      restore_backup: {
        description: 'Restore from backup',
        endpoint: 'POST /api/ai/backup/:name/restore',
        ai_action: 'Restores database from specified backup',
      },
    },
    
    automation_level: 'semi-automated',
    human_approval_required: [
      'Database migrations (execution)',
      'System configuration changes',
      'Production deployments',
    ],
  };
  
  res.json(instructions);
});

export default router;
