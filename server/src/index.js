import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import prisma from './db/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import brandRoutes from './routes/brands.js';
import warehouseRoutes from './routes/warehouses.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import referralRoutes from './routes/referrals.js';
import settingsRoutes from './routes/settings.js';
import chatRoutes from './routes/chat.js';
import accountingRoutes from './routes/accounting.js';
import addressRoutes from './routes/addresses.js';
import sitemapRoutes from './routes/sitemap.js';
import monitoringRoutes from './routes/monitoring.js';
import aiRoutes from './routes/ai.js';
import wishlistRoutes from './routes/wishlist.js';
import couponRoutes from './routes/coupons.js';
import reviewRoutes from './routes/reviews.js';
import analyticsRoutes from './routes/analytics.js';
import stockTransferRoutes from './routes/stockTransfer.js';
import customerRoutes from './routes/customers.js';
import bulkRoutes from './routes/bulk.js';
import auditRoutes from './routes/audit.js';
import stockAlertRoutes from './routes/stockAlerts.js';
import invoiceRoutes from './routes/invoices.js';
import variantRoutes from './routes/variants.js';
import productStockRoutes from './routes/productStock.js';
import featureFlagRoutes from './routes/featureFlags.js';
import logRoutes from './routes/logs.js';
import notificationRoutes from './routes/notifications.js';
import apiKeyRoutes from './routes/apiKeys.js';
import loyaltyRoutes from './routes/loyalty.js';

import { auditLog } from './middleware/audit.js';
import { devLogger } from './services/devLogger.js';
import { backupManager } from './services/backupManager.js';
import { migrationManager } from './services/migrationManager.js';
import aiUploadHandler from './services/aiUploadHandler.js';
import { requestLogger } from './services/logger.js';
import { errorHandler, notFoundHandler, sanitizeInput } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5178',
    'https://client-bnm3di8o2-ctys-projects-d2c7e615.vercel.app',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api/auth/login', loginLimiter);

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many messages, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many searches, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/chat', chatLimiter);
app.use('/api/products/search', searchLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(sanitizeInput);
app.use(requestLogger);

app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', auditLog('User'), userRoutes);
app.use('/api/products', auditLog('Product'), productRoutes);
app.use('/api/categories', auditLog('Category'), categoryRoutes);
app.use('/api/brands', auditLog('Brand'), brandRoutes);
app.use('/api/warehouses', auditLog('Warehouse'), warehouseRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', auditLog('Order'), orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/addresses', addressRoutes);
app.use(sitemapRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', auditLog('Coupon'), couponRoutes);
app.use('/api/reviews', auditLog('Review'), reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stock-transfer', auditLog('StockTransfer'), stockTransferRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bulk', auditLog('Bulk'), bulkRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/variants', auditLog('Variant'), variantRoutes);
app.use('/api/product-stock', auditLog('ProductStock'), productStockRoutes);
app.use('/api/features', featureFlagRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/loyalty', loyaltyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

try {
  const prisma = (await import('./db/prisma.js')).default;

  const settings = [
    { key: 'ai_enabled', value: 'true' },
    { key: 'ai_provider', value: 'lmstudio' },
    { key: 'ai_name', value: 'JARVIS' },
    { key: 'ai_lmStudioUrl', value: 'http://localhost:1234' },
    { key: 'ai_llmStudioUrl', value: 'http://localhost:1234' },
    { key: 'ai_name', value: 'JARVIS' },
    { key: 'ai_systemPrompt', value: `You are JARVIS, HiperCom's virtual shopping assistant. You help customers with:
      - Product information (availability, prices, features)
      - Order status and tracking
      - Shipping and delivery options
      - Payment methods and policies
      - Returns and refunds

      Keep responses concise, professional, and helpful. Do NOT reveal you are an AI model or mention Google, OpenAI, or any AI company. Always identify as "JARVIS - HiperCom Assistant". When asked about your identity, say "I am JARVIS, your personal shopping assistant from HiperCom."

      You have access to live product inventory. Use this information to help customers make informed decisions.` },
  ];

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
}

aiUploadHandler.startWatching();
console.log('✅ AI Upload Handler started');

devLogger.info('Server initialization complete');
devLogger.info('✅ Dev Logger active');

const migrationStatus = migrationManager.getStatus();
console.log(`📊 Migrations: ${migrationStatus.applied} applied, ${migrationStatus.pending} pending`);

const backups = backupManager.listBackups();
console.log(`💾 Backups: ${backups.length} available`);

const { checkLowStockAndAlert } = await import('./routes/stockAlerts.js');
await checkLowStockAndAlert();
setInterval(async () => {
  const count = await checkLowStockAndAlert();
  if (count > 0) console.log(`📦 Low stock alerts: ${count} products`);
}, 6 * 60 * 60 * 1000);
console.log('✅ Low Stock Alert scheduler started');

const now = new Date();
const nextBackup = new Date(now);
nextBackup.setHours(2, 0, 0, 0);
if (now > nextBackup) nextBackup.setDate(nextBackup.getDate() + 1);
const msUntilBackup = nextBackup - now;

setTimeout(async () => {
  await backupManager.createBackup();
  console.log('✅ Automated backup completed');
  setInterval(async () => {
    await backupManager.createBackup();
    console.log('✅ Automated backup completed');
  }, 24 * 60 * 60 * 1000);
}, msUntilBackup);
console.log(`⏰ Automated backup scheduled for ${nextBackup.toLocaleString()}`);

const { deleteOldNotifications } = await import('./services/notifications.js');
setInterval(async () => {
  const result = await deleteOldNotifications(30);
  console.log(`🧹 Cleaned ${result.deleted} old notifications`);
}, 24 * 60 * 60 * 1000);
console.log('✅ Notification cleanup scheduler started');

} catch (error) {
console.error('Failed to initialize services:', error.message);
devLogger.error(`Initialization error: ${error.message}`);
}
});

export default app;