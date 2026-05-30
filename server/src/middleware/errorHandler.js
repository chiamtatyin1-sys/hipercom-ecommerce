import { logger } from '../services/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  }

  if (err.code === 'P2002') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = `Duplicate entry: ${err.meta?.target?.join(', ') || 'unique constraint'}`;
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Record not found';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    message = err.message;
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload too large';
  }

  const isProduction = process.env.NODE_ENV === 'production';

  logger.errorWithContext(err, req, {
    statusCode,
    code,
    userId: req.user?.id,
    userAgent: req.get('user-agent'),
  });

  const response = {
    error: message,
    code,
    ...(isProduction ? {} : { stack: err.stack }),
  };

  if (err.errors) {
    response.details = err.errors;
  }

  if (err.meta) {
    response.meta = err.meta;
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route ${req.method} ${req.url} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateSchema(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));

      const validationError = new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR'
      );
      validationError.errors = details;

      return next(validationError);
    }

    next();
  };
}

export function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof value === 'object') {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
}
