/**
 * Development Logger Service
 * Real-time logging with colors, categories, and file output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log storage
const LOG_FILE = path.join(__dirname, '../../logs/dev.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOGS_TO_KEEP = 5;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Colors for console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Log levels
const LEVELS = {
  ERROR: { level: 0, color: colors.red, label: 'ERROR' },
  WARN: { level: 1, color: colors.yellow, label: 'WARN' },
  INFO: { level: 2, color: colors.green, label: 'INFO' },
  DEBUG: { level: 3, color: colors.blue, label: 'DEBUG' },
  API: { level: 3, color: colors.cyan, label: 'API' },
  DB: { level: 3, color: colors.magenta, label: 'DB' },
};

// Current log level (can be changed via API)
let currentLevel = 'DEBUG';

// In-memory log buffer (last 1000 logs)
const logBuffer = [];
const MAX_BUFFER_SIZE = 1000;

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function writeToLog(message, level) {
  const timestamp = formatTimestamp();
  const logLevel = LEVELS[level] || LEVELS.INFO;
  
  // Skip if below current level
  if (logLevel.level > LEVELS[currentLevel].level) return;

  const logEntry = {
    timestamp,
    level: level,
    message,
    color: logLevel.color,
  };

  // Add to buffer
  logBuffer.push(logEntry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Console output
  const consoleMsg = `${logLevel.color}[${timestamp}] [${logLevel.label}]${colors.reset} ${message}`;
  console.log(consoleMsg);

  // File output
  try {
    const fileEntry = `[${timestamp}] [${logLevel.label}] ${message}\n`;
    
    // Check file size and rotate if needed
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        // Rotate logs
        for (let i = MAX_LOGS_TO_KEEP - 1; i > 0; i--) {
          const oldFile = `${LOG_FILE}.${i}`;
          if (fs.existsSync(oldFile)) {
            fs.renameSync(oldFile, `${LOG_FILE}.${i + 1}`);
          }
        }
        fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
      }
    }
    
    fs.appendFileSync(LOG_FILE, fileEntry);
  } catch (err) {
    // Silent fail for file logging
  }
}

// Public API
export const devLogger = {
  error: (msg) => writeToLog(msg, 'ERROR'),
  warn: (msg) => writeToLog(msg, 'WARN'),
  info: (msg) => writeToLog(msg, 'INFO'),
  debug: (msg) => writeToLog(msg, 'DEBUG'),
  api: (msg) => writeToLog(msg, 'API'),
  db: (msg) => writeToLog(msg, 'DB'),
  
  // Get recent logs
  getLogs: (count = 100, level = null) => {
    const filtered = level ? logBuffer.filter(l => l.level === level) : logBuffer;
    return filtered.slice(-count);
  },
  
  // Get log statistics
  getStats: () => {
    const stats = {
      total: logBuffer.length,
      byLevel: {},
      startTime: logBuffer[0]?.timestamp || null,
      lastTime: logBuffer[logBuffer.length - 1]?.timestamp || null,
    };
    
    logBuffer.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });
    
    return stats;
  },
  
  // Set log level
  setLevel: (level) => {
    if (LEVELS[level]) {
      currentLevel = level;
      devLogger.info(`Log level set to ${level}`);
      return true;
    }
    return false;
  },
  
  // Clear logs
  clear: () => {
    logBuffer.length = 0;
    if (fs.existsSync(LOG_FILE)) {
      fs.truncateSync(LOG_FILE, 0);
    }
    devLogger.info('Logs cleared');
  },
};

// Auto-log server start
devLogger.info('DevLogger initialized');
devLogger.info(`Log file: ${LOG_FILE}`);
devLogger.info(`Max log size: ${MAX_LOGS_TO_KEEP} files, ${MAX_LOG_SIZE / 1024 / 1024}MB each`);

export default devLogger;
