import { validationResult, body, param, query } from 'express-validator';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateUser = {
  register: [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone required'),
    handleValidation,
  ],
  login: [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required'),
    handleValidation,
  ],
  update: [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone required'),
    handleValidation,
  ],
};

export const validateProduct = {
  create: [
    body('name').trim().notEmpty().withMessage('Product name required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('sku').trim().notEmpty().withMessage('SKU required'),
    handleValidation,
  ],
  update: [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().trim().notEmpty().withMessage('Product name required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    handleValidation,
  ],
};

export const validateOrder = {
  create: [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('deliveryType').isIn(['shipping', 'pickup']).withMessage('Invalid delivery type'),
    handleValidation,
  ],
};

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidation,
];