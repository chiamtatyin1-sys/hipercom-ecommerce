/**
 * Backup Manager Service
 * Automated backups with rollback capability
 * Supports multiple backup modes: manual, auto, pre-migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../../dev.db');

// Backup modes
const BACKUP_MODES = {
  MANUAL: 'manual',
  AUTO: 'auto',
  PRE_MIGRATION: 'pre-migration',
  PRE_DEPLOY: 'pre-deploy',
};

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class BackupManager {
  constructor() {
    this.maxBackups = 10;
  }

  /**
   * Create a backup
   * @param {string} mode - Backup mode (manual, auto, pre-migration, pre-deploy)
   * @param {string} description - Optional description
   * @returns {Promise<object>} Backup info
   */
  async createBackup(mode = BACKUP_MODES.MANUAL, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupName = `backup_${timestamp}_${mode}`;
    const backupPath = path.join(BACKUP_DIR, `${backupName}.db`);
    const metadataPath = `${backupPath}.meta.json`;

    try {
      // Copy database
      await this._copyFile(DB_PATH, backupPath);

      // Create metadata
      const metadata = {
        name: backupName,
        mode,
        description,
        timestamp: new Date().toISOString(),
        size: fs.statSync(backupPath).size,
        checksum: await this._calculateChecksum(backupPath),
      };

      // Save metadata
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Cleanup old backups
      await this._cleanupOldBackups();

      console.log(`✓ Backup created: ${backupName}`);
      return metadata;
    } catch (error) {
      console.error('✗ Backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Restore from backup
   * @param {string} backupName - Name of backup to restore
   * @returns {Promise<void>}
   */
  async restoreBackup(backupName) {
    const backupPath = path.join(BACKUP_DIR, `${backupName}.db`);
    const metadataPath = `${backupPath}.meta.json`;

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupName}`);
    }

    try {
      // Verify checksum
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const currentChecksum = await this._calculateChecksum(backupPath);
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Backup checksum mismatch - file may be corrupted');
      }

      // Create emergency backup before restore
      await this.createBackup(BACKUP_MODES.PRE_MIGRATION, 'Emergency backup before restore');

      // Restore database
      await this._copyFile(backupPath, DB_PATH);

      console.log(`✓ Restored from: ${backupName}`);
      return { success: true, message: `Restored from ${backupName}` };
    } catch (error) {
      console.error('✗ Restore failed:', error.message);
      throw error;
    }
  }

  /**
   * List all available backups
   * @returns {Array<object>} List of backups with metadata
   */
  listBackups() {
    const backups = [];
    
    try {
      const files = fs.readdirSync(BACKUP_DIR);
      
      files.forEach(file => {
        if (file.endsWith('.db')) {
          const metadataPath = path.join(BACKUP_DIR, `${file}.meta.json`);
          let metadata = null;
          
          if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          } else {
            metadata = {
              name: file.replace('.db', ''),
              timestamp: fs.statSync(path.join(BACKUP_DIR, file)).mtime.toISOString(),
              size: fs.statSync(path.join(BACKUP_DIR, file)).size,
            };
          }
          
          backups.push(metadata);
        }
      });
      
      // Sort by timestamp (newest first)
      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error listing backups:', error.message);
      return [];
    }
  }

  /**
   * Delete a backup
   * @param {string} backupName - Name of backup to delete
   * @returns {Promise<void>}
   */
  async deleteBackup(backupName) {
    const backupPath = path.join(BACKUP_DIR, `${backupName}.db`);
    const metadataPath = `${backupPath}.meta.json`;

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupName}`);
    }

    try {
      fs.unlinkSync(backupPath);
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }
      console.log(`✓ Deleted backup: ${backupName}`);
    } catch (error) {
      console.error('✗ Delete failed:', error.message);
      throw error;
    }
  }

  /**
   * Get backup info
   * @param {string} backupName - Name of backup
   * @returns {object|null} Backup metadata or null
   */
  getBackupInfo(backupName) {
    const metadataPath = path.join(BACKUP_DIR, `${backupName}.db.meta.json`);
    
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    
    return null;
  }

  /**
   * Internal: Copy file
   */
  async _copyFile(source, dest) {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(source);
      const writeStream = fs.createWriteStream(dest);

      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('close', resolve);

      readStream.pipe(writeStream);
    });
  }

  /**
   * Internal: Calculate checksum
   */
  async _calculateChecksum(filePath) {
    const crypto = await import('crypto');
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Internal: Cleanup old backups
   */
  async _cleanupOldBackups() {
    const backups = this.listBackups();
    
    if (backups.length > this.maxBackups) {
      // Delete oldest backups
      const toDelete = backups.slice(this.maxBackups);
      
      for (const backup of toDelete) {
        await this.deleteBackup(backup.name);
      }
    }
  }
}

// Export singleton instance
export const backupManager = new BackupManager();
export default backupManager;
