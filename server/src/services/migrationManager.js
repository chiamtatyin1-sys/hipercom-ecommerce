/**
 * Database Migration Manager
 * Handles schema migrations with rollback capability
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '../db/prisma.js';
import { backupManager } from './backupManager.js';
import { devLogger } from './devLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');
const MIGRATION_LOG_FILE = path.join(MIGRATIONS_DIR, 'migration_log.json');

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

class MigrationManager {
  constructor() {
    this.migrationLog = this.loadMigrationLog();
  }

  /**
   * Load migration log
   */
  loadMigrationLog() {
    if (fs.existsSync(MIGRATION_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(MIGRATION_LOG_FILE, 'utf8'));
    }
    return { migrations: [], lastMigration: null };
  }

  /**
   * Save migration log
   */
  saveMigrationLog() {
    fs.writeFileSync(MIGRATION_LOG_FILE, JSON.stringify(this.migrationLog, null, 2));
  }

  /**
   * Create a new migration
   * @param {string} name - Migration name
   * @param {string} description - Migration description
   * @returns {Promise<object>} Migration info
   */
  async createMigration(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const migrationName = `${timestamp}_${name.replace(/\s+/g, '_')}`;
    const migrationDir = path.join(MIGRATIONS_DIR, migrationName);
    
    try {
      // Create migration directory
      fs.mkdirSync(migrationDir, { recursive: true });
      
      // Create up.sql (forward migration)
      const upSqlPath = path.join(migrationDir, 'up.sql');
      fs.writeFileSync(upSqlPath, `-- Migration: ${name}\n-- Description: ${description}\n-- Date: ${timestamp}\n\n-- Add your SQL changes here\n`);
      
      // Create down.sql (rollback migration)
      const downSqlPath = path.join(migrationDir, 'down.sql');
      fs.writeFileSync(downSqlPath, `-- Rollback: ${name}\n-- Description: ${description}\n-- Date: ${timestamp}\n\n-- Add your rollback SQL here\n`);
      
      // Create metadata
      const metadata = {
        name: migrationName,
        originalName: name,
        description,
        timestamp,
        status: 'pending',
        upSql: 'up.sql',
        downSql: 'down.sql',
      };
      
      fs.writeFileSync(path.join(migrationDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
      
      devLogger.info(`✓ Created migration: ${migrationName}`);
      
      return metadata;
    } catch (error) {
      devLogger.error(`✗ Failed to create migration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   * @param {boolean} createBackup - Whether to create backup before migrating
   * @returns {Promise<object>} Migration results
   */
  async runMigrations(createBackup = true) {
    const pendingMigrations = this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      return { success: true, message: 'No pending migrations', applied: [] };
    }
    
    const results = {
      success: true,
      applied: [],
      failed: [],
      backup: null,
    };
    
    try {
      // Create backup before migration
      if (createBackup) {
        devLogger.info('Creating backup before migration...');
        results.backup = await backupManager.createBackup('pre-migration', `Before running ${pendingMigrations.length} migrations`);
      }
      
      // Run each migration
      for (const migration of pendingMigrations) {
        try {
          await this.applyMigration(migration);
          results.applied.push(migration.name);
        } catch (error) {
          results.failed.push({ name: migration.name, error: error.message });
          results.success = false;
          devLogger.error(`Migration failed: ${migration.name} - ${error.message}`);
          break; // Stop on first failure
        }
      }
      
      if (results.success) {
        devLogger.info(`✓ Applied ${results.applied.length} migrations`);
      } else {
        devLogger.error(`✗ Migration failed. ${results.applied.length} applied, ${results.failed.length} failed`);
      }
      
      return results;
    } catch (error) {
      devLogger.error(`Migration process failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration) {
    const migrationDir = path.join(MIGRATIONS_DIR, migration.name);
    const upSqlPath = path.join(migrationDir, 'up.sql');
    
    if (!fs.existsSync(upSqlPath)) {
      throw new Error(`Migration SQL file not found: ${upSqlPath}`);
    }
    
    const sql = fs.readFileSync(upSqlPath, 'utf8');
    
    devLogger.info(`Applying migration: ${migration.name}`);
    
    // Execute SQL
    await prisma.$executeRawUnsafe(sql);
    
    // Update migration log
    this.migrationLog.migrations.push({
      name: migration.name,
      appliedAt: new Date().toISOString(),
      status: 'applied',
    });
    
    this.migrationLog.lastMigration = migration.name;
    this.saveMigrationLog();
    
    devLogger.info(`✓ Migration applied: ${migration.name}`);
  }

  /**
   * Rollback last migration
   * @returns {Promise<object>} Rollback result
   */
  async rollbackLast() {
    const lastMigration = this.migrationLog.migrations[this.migrationLog.migrations.length - 1];
    
    if (!lastMigration || lastMigration.status !== 'applied') {
      throw new Error('No migrations to rollback');
    }
    
    const migrationDir = path.join(MIGRATIONS_DIR, lastMigration.name);
    const downSqlPath = path.join(migrationDir, 'down.sql');
    
    if (!fs.existsSync(downSqlPath)) {
      throw new Error(`Rollback SQL not found: ${downSqlPath}`);
    }
    
    const sql = fs.readFileSync(downSqlPath, 'utf8');
    
    devLogger.info(`Rolling back migration: ${lastMigration.name}`);
    
    // Execute rollback SQL
    await prisma.$executeRawUnsafe(sql);
    
    // Update migration log
    lastMigration.status = 'rolled-back';
    lastMigration.rolledBackAt = new Date().toISOString();
    this.saveMigrationLog();
    
    devLogger.info(`✓ Migration rolled back: ${lastMigration.name}`);
    
    return { success: true, migration: lastMigration.name };
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations() {
    const appliedMigrations = new Set(
      this.migrationLog.migrations.map(m => m.name)
    );
    
    const allMigrations = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => fs.statSync(path.join(MIGRATIONS_DIR, file)).isDirectory())
      .filter(file => !file.startsWith('.'));
    
    return allMigrations
      .filter(name => !appliedMigrations.has(name))
      .sort()
      .map(name => ({
        name,
        path: path.join(MIGRATIONS_DIR, name),
      }));
  }

  /**
   * Get migration status
   */
  getStatus() {
    const pending = this.getPendingMigrations();
    const applied = this.migrationLog.migrations.filter(m => m.status === 'applied');
    
    return {
      total: applied.length + pending.length,
      applied: applied.length,
      pending: pending.length,
      lastMigration: this.migrationLog.lastMigration,
      migrations: this.migrationLog.migrations,
    };
  }

  /**
   * List all migrations
   */
  listMigrations() {
    return fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => fs.statSync(path.join(MIGRATIONS_DIR, file)).isDirectory())
      .map(name => {
        const metadataPath = path.join(MIGRATIONS_DIR, name, 'metadata.json');
        const metadata = fs.existsSync(metadataPath) 
          ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
          : { name };
        
        const applied = this.migrationLog.migrations.find(m => m.name === name);
        
        return {
          ...metadata,
          status: applied ? applied.status : 'pending',
          appliedAt: applied ? applied.appliedAt : null,
        };
      });
  }
}

// Export singleton
export const migrationManager = new MigrationManager();
export default migrationManager;
