import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

const CURRENT_LEVEL = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL] : LOG_LEVELS.INFO;

function formatLog(level, message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (meta.error) {
    logEntry.error = {
      message: meta.error.message,
      stack: meta.error.stack,
      code: meta.error.code,
    };
  }

  if (meta.req) {
    logEntry.request = {
      method: meta.req.method,
      url: meta.req.url,
      ip: meta.req.ip,
      userAgent: meta.req.get?.('user-agent'),
    };
  }

  if (meta.res) {
    logEntry.response = {
      statusCode: meta.res.statusCode,
      responseTime: meta.res.responseTime,
    };
  }

  Object.keys(meta).forEach(key => {
    if (!['error', 'req', 'res'].includes(key) && typeof meta[key] !== 'function') {
      try {
        JSON.stringify(meta[key]);
        logEntry[key] = meta[key];
      } catch {
        logEntry[key] = String(meta[key]);
      }
    }
  });

  return JSON.stringify(logEntry);
}

function rotateLog(logFile) {
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > MAX_LOG_SIZE) {
        const baseName = path.basename(logFile, '.log');
        const dir = path.dirname(logFile);

        for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
          const oldFile = path.join(dir, `${baseName}-${i}.log`);
          const newFile = path.join(dir, `${baseName}-${i + 1}.log`);

          if (fs.existsSync(oldFile)) {
            if (i === MAX_LOG_FILES - 1) {
              fs.unlinkSync(oldFile);
            } else {
              fs.renameSync(oldFile, newFile);
            }
          }
        }

        fs.renameSync(logFile, path.join(dir, `${baseName}-1.log`));
      }
    }
  } catch (error) {
    console.error('Log rotation error:', error);
  }
}

function writeLog(logFile, logString) {
  try {
    rotateLog(logFile);
    fs.appendFileSync(logFile, logString + '\n');
  } catch (error) {
    console.error('Write log error:', error);
  }
}

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

  const logString = formatLog(level, message, meta);

  writeLog(LOG_FILE, logString);

  if (LOG_LEVELS[level] >= LOG_LEVELS.ERROR) {
    writeLog(ERROR_LOG_FILE, logString);
  }

  if (process.env.NODE_ENV === 'development') {
    const consoleMeta = { ...meta };
    delete consoleMeta.req;
    delete consoleMeta.res;
    delete consoleMeta.error;

    const prefix = {
      DEBUG: '\x1b[90m',
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      FATAL: '\x1b[35m',
    }[level];

    console.log(`${prefix}[${level}]\x1b[0m ${message}`, Object.keys(consoleMeta).length ? consoleMeta : '');
  }
}

export const logger = {
  debug: (message, meta) => log('DEBUG', message, meta),
  info: (message, meta) => log('INFO', message, meta),
  warn: (message, meta) => log('WARN', message, meta),
  error: (message, meta) => log('ERROR', message, meta),
  fatal: (message, meta) => log('FATAL', message, meta),

  request: (req, res, responseTime) => {
    log('INFO', `${req.method} ${req.url}`, {
      req,
      res,
      responseTime,
    });
  },

  errorWithContext: (error, req, context = {}) => {
    log('ERROR', error.message || 'Unknown error', {
      error,
      req,
      ...context,
    });
  },
};

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    res.responseTime = responseTime;

    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';

    log(level, `${req.method} ${req.url} ${res.statusCode}`, {
      req,
      res,
      responseTime,
    });
  });

  next();
}

export function getLogs(options = {}) {
  const { level, limit = 100, offset = 0, search } = options;

  try {
    if (!fs.existsSync(LOG_FILE)) {
      return { logs: [], total: 0 };
    }

    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    let filtered = lines;

    if (level) {
      filtered = filtered.filter(line => {
        try {
          const parsed = JSON.parse(line);
          return parsed.level === level;
        } catch {
          return false;
        }
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(line => line.toLowerCase().includes(searchLower));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    const logs = paginated.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });

    return { logs, total };
  } catch (error) {
    console.error('Get logs error:', error);
    return { logs: [], total: 0 };
  }
}

export function getErrorLogs(options = {}) {
  const { limit = 100, offset = 0 } = options;

  try {
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return { logs: [], total: 0 };
    }

    const content = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    const total = lines.length;
    const paginated = lines.slice(offset, offset + limit);

    const logs = paginated.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });

    return { logs, total };
  } catch (error) {
    console.error('Get error logs error:', error);
    return { logs: [], total: 0 };
  }
}

export function clearLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '');
    }
    if (fs.existsSync(ERROR_LOG_FILE)) {
      fs.writeFileSync(ERROR_LOG_FILE, '');
    }
    return { message: 'Logs cleared' };
  } catch (error) {
    console.error('Clear logs error:', error);
    throw error;
  }
}

export function getLogStats() {
  try {
    const stats = {
      totalSize: 0,
      fileCount: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
    };

    if (fs.existsSync(LOG_DIR)) {
      const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log'));
      stats.fileCount = files.length;

      files.forEach(file => {
        const filePath = path.join(LOG_DIR, file);
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;
      });
    }

    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      lines.forEach(line => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.level === 'ERROR') stats.errorCount++;
          else if (parsed.level === 'WARN') stats.warnCount++;
          else if (parsed.level === 'INFO') stats.infoCount++;
        } catch {
          // Skip malformed lines
        }
      });
    }

    return stats;
  } catch (error) {
    console.error('Get log stats error:', error);
    return { totalSize: 0, fileCount: 0, errorCount: 0, warnCount: 0, infoCount: 0 };
  }
}
