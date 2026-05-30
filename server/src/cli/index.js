import readline from 'readline';
import prisma from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import { generateToken, generateReferralCode } from '../middleware/auth.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function log(color, msg) {
  const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'user':
        await handleUserCommand(args.slice(1));
        break;
      case 'order':
        await handleOrderCommand(args.slice(1));
        break;
      case 'payment':
        await handlePaymentCommand(args.slice(1));
        break;
      case 'product':
        await handleProductCommand(args.slice(1));
        break;
      case 'db':
        await handleDbCommand(args.slice(1));
        break;
      case 'chat':
        await handleChatCommand(args.slice(1));
        break;
      case 'logs':
        await handleLogsCommand(args.slice(1));
        break;
      case 'debug':
        await handleDebugCommand(args.slice(1));
        break;
      case 'health':
        await handleHealthCommand(args.slice(1));
        break;
      case 'test':
        await handleTestCommand(args.slice(1));
        break;
      case 'generate':
        await handleGenerateCommand(args.slice(1));
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.log('Unknown command. Run: node cli.js help');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

async function handleUserCommand(args) {
  const action = args[0];

  switch (action) {
    case 'list': {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true, role: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      console.table(users);
      break;
    }
    case 'create': {
      const username = args[1];
      const email = args[2];
      const password = args[3] || 'password123';
      const role = args[4] || 'customer';

      if (!username || !email) {
        console.log('Usage: node cli.js user create <username> <email> [password] [role]');
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role,
          referralCode: generateReferralCode(),
        },
      });
      console.log('User created:', user.id);
      break;
    }
    case 'show': {
      const userId = args[1];
      if (!userId) {
        console.log('Usage: node cli.js user show <user_id>');
        return;
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { orders: true, addresses: true },
      });
      console.log(JSON.stringify(user, null, 2));
      break;
    }
    case 'reset-password': {
      const userId = args[1];
      const newPassword = args[2];
      if (!userId || !newPassword) {
        console.log('Usage: node cli.js user reset-password <user_id> <new_password>');
        return;
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
      console.log('Password reset for user:', userId);
      break;
    }
    case 'delete': {
      const userId = args[1];
      if (!userId) {
        console.log('Usage: node cli.js user delete <user_id>');
        return;
      }
      await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
      console.log('User deactivated:', userId);
      break;
    }
    default:
      console.log('User commands: list, create, show, reset-password, delete');
  }
}

async function handleOrderCommand(args) {
  const action = args[0];

  switch (action) {
    case 'list': {
      const status = args[1];
      const where = {};
      if (status) where.status = status;

      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { username: true, email: true } } },
      });
      console.table(orders.map(o => ({
        id: o.id.slice(0, 8),
        orderNumber: o.orderNumber,
        user: o.user.username,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
      })));
      break;
    }
    case 'show': {
      const orderId = args[1];
      if (!orderId) {
        console.log('Usage: node cli.js order show <order_id>');
        return;
      }
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: { include: { product: true, variant: true } },
          payment: true,
        },
      });
      console.log(JSON.stringify(order, null, 2));
      break;
    }
    case 'update-status': {
      const orderId = args[1];
      const status = args[2];
      if (!orderId || !status) {
        console.log('Usage: node cli.js order update-status <order_id> <status>');
        return;
      }
      await prisma.order.update({ where: { id: orderId }, data: { status } });
      console.log('Order status updated to:', status);
      break;
    }
    case 'cancel': {
      const orderId = args[1];
      if (!orderId) {
        console.log('Usage: node cli.js order cancel <order_id>');
        return;
      }
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', paymentStatus: 'refunded' },
      });
      console.log('Order cancelled:', orderId);
      break;
    }
    default:
      console.log('Order commands: list, show, update-status, cancel');
  }
}

async function handlePaymentCommand(args) {
  const action = args[0];

  switch (action) {
    case 'list': {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { order: { select: { orderNumber: true, total: true } } },
      });
      console.table(payments.map(p => ({
        id: p.id.slice(0, 8),
        order: p.order?.orderNumber,
        amount: p.amount,
        status: p.status,
        method: p.method,
      })));
      break;
    }
    case 'show': {
      const orderId = args[1];
      if (!orderId) {
        console.log('Usage: node cli.js payment show <order_id>');
        return;
      }
      const payment = await prisma.payment.findUnique({
        where: { orderId },
      });
      console.log(JSON.stringify(payment, null, 2));
      break;
    }
    case 'check': {
      const paymentId = args[1];
      if (!paymentId) {
        console.log('Usage: node cli.js payment check <payment_id>');
        return;
      }
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      if (payment) {
        console.log('Payment Status:', payment.status);
        console.log('Order Status:', payment.order?.status);
        console.log('Payment Status:', payment.order?.paymentStatus);
      } else {
        console.log('Payment not found');
      }
      break;
    }
    case 'refund': {
      const orderId = args[1];
      const amount = args[2];
      if (!orderId) {
        console.log('Usage: node cli.js payment refund <order_id> [amount]');
        return;
      }
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
      if (order?.paymentStatus === 'paid') {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'refunded', status: 'cancelled' },
        });
        if (order.payment) {
          await prisma.payment.update({ where: { id: order.payment.id }, data: { status: 'refunded' } });
        }
        console.log('Order refunded:', orderId);
      } else {
        console.log('Order not paid or already refunded');
      }
      break;
    }
    default:
      console.log('Payment commands: list, show, check, refund');
  }
}

async function handleProductCommand(args) {
  const action = args[0];

  switch (action) {
    case 'list': {
      const products = await prisma.product.findMany({
        select: { id: true, name: true, price: true, stock: true, sku: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      console.table(products);
      break;
    }
    case 'low-stock': {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          stock: { lte: 10 },
        },
        select: { id: true, name: true, stock: true, lowStockAlert: true, sku: true },
      });
      console.table(products);
      break;
    }
    default:
      console.log('Product commands: list, low-stock');
  }
}

async function handleDbCommand(args) {
  const action = args[0];

  switch (action) {
    case 'status': {
      const users = await prisma.user.count();
      const products = await prisma.product.count();
      const orders = await prisma.order.count();
      console.log({ users, products, orders });
      break;
    }
    case 'reset': {
      const confirm = await ask('Are you sure? This will delete all data (yes/no): ');
      if (confirm.toLowerCase() === 'yes') {
        await prisma.payment.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.cartItem.deleteMany();
        await prisma.productVariant.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
        await prisma.brand.deleteMany();
        await prisma.user.deleteMany();
        console.log('Database reset complete');
      } else {
        console.log('Cancelled');
      }
      break;
    }
    case 'seed': {
      console.log('Running seed...');
      // Create sample data
      const adminPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: adminPassword,
          role: 'admin',
          referralCode: 'ADMIN001',
        },
      });
      console.log('Seed complete');
      break;
    }
    default:
      console.log('DB commands: status, reset, seed');
  }
}

async function handleChatCommand(args) {
  const action = args[0];

  switch (action) {
    case 'history': {
      const userId = args[1];
      const where = {};
      if (userId) where.userId = userId;

      const messages = await prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { username: true, email: true } } },
      });
      console.table(messages.map(m => ({
        id: m.id.slice(0, 8),
        user: m.user?.username || 'Guest',
        message: m.message.substring(0, 30),
        response: m.response?.substring(0, 30),
        intent: m.intent,
        createdAt: m.createdAt,
      })));
      break;
    }
    case 'clear': {
      const userId = args[1];
      if (userId) {
        await prisma.chatMessage.deleteMany({ where: { userId } });
        console.log('Chat history cleared for user:', userId);
      } else {
        await prisma.chatMessage.deleteMany();
        console.log('All chat history cleared');
      }
      break;
    }
    default:
      console.log('Chat commands: history [user_id], clear [user_id]');
  }
}

async function handleLogsCommand(args) {
  const action = args[0];
  const count = parseInt(args[1]) || 50;

  switch (action) {
    case 'recent': {
      const transactions = await prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: count,
      });
      console.table(transactions);
      break;
    }
    case 'errors': {
      console.log('No error logs available (check server console)');
      break;
    }
    default:
      console.log('Logs commands: recent [count], errors');
  }
}

async function handleDebugCommand(args) {
  const action = args[0];
  const id = args[1];

  switch (action) {
    case 'payment': {
      if (!id) {
        console.log('Usage: node cli.js debug payment <order_id>');
        return;
      }
      const order = await prisma.order.findUnique({
        where: { id },
        include: { payment: true, user: true, items: { include: { product: true } } },
      });
      if (order) {
        console.log('=== Payment Debug ===');
        console.log('Order:', order.orderNumber);
        console.log('Status:', order.status);
        console.log('Payment Status:', order.paymentStatus);
        console.log('HitPay ID:', order.hitpayId);
        console.log('Total:', order.total);
        console.log('User:', order.user.email);
        console.log('Items:', order.items.length);
      } else {
        console.log('Order not found');
      }
      break;
    }
    case 'order': {
      if (!id) {
        console.log('Usage: node cli.js debug order <order_id>');
        return;
      }
      const order = await prisma.order.findUnique({
        where: { id },
        include: { user: true, items: { include: { product: true, variant: true } } },
      });
      if (order) {
        console.log('=== Order Debug ===');
        console.log(JSON.stringify(order, null, 2));
      } else {
        console.log('Order not found');
      }
      break;
    }
    case 'user': {
      if (!id) {
        console.log('Usage: node cli.js debug user <user_id>');
        return;
      }
      const user = await prisma.user.findUnique({
        where: { id },
        include: { orders: true, addresses: true, chatMessages: true },
      });
      if (user) {
        console.log('=== User Debug ===');
        console.log('ID:', user.id);
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('Active:', user.isActive);
        console.log('Orders:', user.orders.length);
        console.log('Addresses:', user.addresses.length);
      } else {
        console.log('User not found');
      }
      break;
    }
    default:
      console.log('Debug commands: payment <order_id>, order <order_id>, user <user_id>');
  }
}

async function handleHealthCommand(args) {
  const action = args[0];

  switch (action) {
    case 'check': {
      log('cyan', '\n=== System Health Check ===\n');

      // Database
      try {
        await prisma.$queryRaw`SELECT 1`;
        log('green', '✓ Database: Connected');
      } catch (error) {
        log('red', '✗ Database: Connection failed');
      }

      // Stats
      const [users, products, orders, payments, reviews, coupons] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.payment.count(),
        prisma.review.count(),
        prisma.coupon.count(),
      ]);

      log('blue', '\n📊 Database Stats:');
      console.table([
        { Entity: 'Users', Count: users },
        { Entity: 'Products', Count: products },
        { Entity: 'Orders', Count: orders },
        { Entity: 'Payments', Count: payments },
        { Entity: 'Reviews', Count: reviews },
        { Entity: 'Coupons', Count: coupons },
      ]);

      // Reservations
      const reservedProducts = await prisma.product.count({ where: { reservedStock: { gt: 0 } } });
      const reservedVariants = await prisma.productVariant.count({ where: { reservedStock: { gt: 0 } } });
      log('yellow', `\n📦 Stock Reservations: ${reservedProducts} products, ${reservedVariants} variants`);

      // Pending orders
      const pendingOrders = await prisma.order.count({ where: { status: 'pending' } });
      log('yellow', `⏳ Pending Orders: ${pendingOrders}`);

      // Low stock
      const lowStock = await prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: prisma.product.fields.lowStockAlert },
        },
      });
      log('red', `⚠️ Low Stock Alerts: ${lowStock}`);

      break;
    }
    case 'orders': {
      const orders = await prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
      });
      log('blue', '\n📦 Order Status Summary:');
      console.table(orders.map(o => ({
        Status: o.status,
        Count: o._count,
        Total: `RM ${o._sum.total?.toFixed(2) || '0.00'}`,
      })));
      break;
    }
    case 'reservations': {
      const products = await prisma.product.findMany({
        where: { reservedStock: { gt: 0 } },
        select: { id: true, name: true, stock: true, reservedStock: true, sku: true },
      });
      const variants = await prisma.productVariant.findMany({
        where: { reservedStock: { gt: 0 } },
        select: { id: true, variantName: true, variantValue: true, stock: true, reservedStock: true, sku: true },
      });
      log('blue', '\n📦 Reserved Products:');
      console.table(products);
      if (variants.length > 0) {
        log('blue', '\n📦 Reserved Variants:');
        console.table(variants);
      }
      break;
    }
    default:
      console.log('Health commands: check, orders, reservations');
  }
}

async function handleTestCommand(args) {
  const action = args[0];

  switch (action) {
    case 'api': {
      log('cyan', '\n=== API Endpoint Tests ===\n');

      // Test health endpoint
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        if (response.ok) {
          log('green', `✓ GET /api/health - ${data.status}`);
        } else {
          log('red', `✗ GET /api/health - ${response.status}`);
        }
      } catch (error) {
        log('red', '✗ GET /api/health - Server not running');
      }

      // Test products endpoint
      try {
        const response = await fetch('http://localhost:3001/api/products');
        const data = await response.json();
        if (response.ok) {
          log('green', `✓ GET /api/products - ${data.products?.length || 0} products`);
        } else {
          log('red', `✗ GET /api/products - ${response.status}`);
        }
      } catch (error) {
        log('red', '✗ GET /api/products - Server not running');
      }

      // Test categories endpoint
      try {
        const response = await fetch('http://localhost:3001/api/categories');
        const data = await response.json();
        if (response.ok) {
          log('green', `✓ GET /api/categories - ${data.categories?.length || 0} categories`);
        } else {
          log('red', `✗ GET /api/categories - ${response.status}`);
        }
      } catch (error) {
        log('red', '✗ GET /api/categories - Server not running');
      }

      break;
    }
    case 'seed': {
      log('cyan', '\n=== Testing Seed Script ===\n');
      try {
        execSync('node prisma/seed.js', { stdio: 'inherit', cwd: process.cwd() });
        log('green', '✓ Seed script completed successfully');
      } catch (error) {
        log('red', '✗ Seed script failed');
      }
      break;
    }
    case 'db': {
      log('cyan', '\n=== Database Tests ===\n');

      // Test relations
      try {
        const user = await prisma.user.findFirst({
          include: {
            orders: { include: { items: true } },
            addresses: true,
            cartItems: true,
          },
        });
        if (user) {
          log('green', `✓ User relations working (${user.orders.length} orders, ${user.addresses.length} addresses)`);
        } else {
          log('yellow', '⚠ No users found to test relations');
        }
      } catch (error) {
        log('red', `✗ User relations failed: ${error.message}`);
      }

      // Test transactions
      try {
        await prisma.$transaction(async (tx) => {
          await tx.settings.upsert({
            where: { key: 'test_transaction' },
            update: {},
            create: { key: 'test_transaction', value: 'ok' },
          });
          await tx.settings.delete({ where: { key: 'test_transaction' } });
        });
        log('green', '✓ Database transactions working');
      } catch (error) {
        log('red', `✗ Database transactions failed: ${error.message}`);
      }

      break;
    }
    default:
      console.log('Test commands: api, seed, db');
  }
}

async function handleGenerateCommand(args) {
  const action = args[0];

  switch (action) {
    case 'products': {
      const count = parseInt(args[1]) || 10;
      log('cyan', `\n=== Generating ${count} Test Products ===\n`);

      const categories = await prisma.category.findMany();
      const brands = await prisma.brand.findMany();
      const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } });

      if (categories.length === 0 || brands.length === 0) {
        log('red', '✗ Need categories and brands first. Run: node cli.js db seed');
        return;
      }

      const productNames = [
        'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', 'Monitor Stand', 'Webcam HD',
        'Bluetooth Speaker', 'Power Bank', 'Laptop Bag', 'Screen Protector', 'Cable Organizer',
        'Desk Lamp', 'Noise Cancelling Earbuds', 'Smart Watch', 'Portable SSD', 'Graphics Tablet',
        'Gaming Chair', 'Standing Desk', 'Wireless Charger', 'Docking Station', 'External GPU',
      ];

      for (let i = 0; i < count; i++) {
        const name = productNames[i % productNames.length] + (i >= productNames.length ? ` v${Math.floor(i / productNames.length) + 1}` : '');
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const price = Math.floor(Math.random() * 500) + 50;
        const stock = Math.floor(Math.random() * 100) + 10;

        await prisma.product.upsert({
          where: { slug },
          update: {},
          create: {
            name,
            slug,
            description: `Test product: ${name}`,
            price,
            costPrice: price * 0.6,
            stock,
            lowStockAlert: 10,
            sku: `TEST-${Date.now().toString(36).toUpperCase()}-${i}`,
            categoryId: categories[i % categories.length].id,
            brandId: brands[i % brands.length].id,
            warehouseId: warehouse?.id,
            isActive: true,
            isFeatured: Math.random() > 0.7,
            images: JSON.stringify(['https://via.placeholder.com/300']),
          },
        });

        log('green', `✓ Created: ${name}`);
      }

      log('cyan', `\n✅ Generated ${count} test products`);
      break;
    }
    case 'orders': {
      const count = parseInt(args[1]) || 5;
      log('cyan', `\n=== Generating ${count} Test Orders ===\n`);

      const users = await prisma.user.findMany({ where: { role: 'customer' } });
      const products = await prisma.product.findMany({ where: { isActive: true }, take: 10 });

      if (users.length === 0 || products.length === 0) {
        log('red', '✗ Need users and products first');
        return;
      }

      const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

      for (let i = 0; i < count; i++) {
        const user = users[i % users.length];
        const product = products[i % products.length];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const total = product.price * quantity;
        const status = statuses[i % statuses.length];

        const order = await prisma.order.create({
          data: {
            orderNumber: `TEST-ORD-${Date.now().toString(36).toUpperCase()}-${i}`,
            userId: user.id,
            status,
            deliveryType: Math.random() > 0.5 ? 'shipping' : 'pickup',
            subtotal: total,
            total,
            shippingAddress: 'Test Address, Test City',
            shippingPhone: '+60123456789',
            shippingName: user.username,
            items: {
              create: {
                productId: product.id,
                quantity,
                price: product.price,
              },
            },
            statusHistory: {
              create: {
                oldStatus: 'none',
                newStatus: status,
                notes: 'Test order created via CLI',
              },
            },
          },
        });

        log('green', `✓ Created order: ${order.orderNumber} (${status})`);
      }

      log('cyan', `\n✅ Generated ${count} test orders`);
      break;
    }
    case 'customers': {
      const count = parseInt(args[1]) || 5;
      log('cyan', `\n=== Generating ${count} Test Customers ===\n`);

      for (let i = 0; i < count; i++) {
        const username = `customer${Date.now().toString(36)}${i}`;
        const email = `${username}@test.com`;
        const password = await bcrypt.hash('password123', 10);

        const user = await prisma.user.create({
          data: {
            username,
            email,
            password,
            role: 'customer',
            referralCode: generateReferralCode(),
            emailVerified: true,
          },
        });

        log('green', `✓ Created customer: ${username} (${email})`);
      }

      log('cyan', `\n✅ Generated ${count} test customers`);
      break;
    }
    case 'reviews': {
      const count = parseInt(args[1]) || 10;
      log('cyan', `\n=== Generating ${count} Test Reviews ===\n`);

      const users = await prisma.user.findMany({ where: { role: 'customer' }, take: 5 });
      const products = await prisma.product.findMany({ take: 5 });

      if (users.length === 0 || products.length === 0) {
        log('red', '✗ Need users and products first');
        return;
      }

      const comments = [
        'Great product, highly recommended!',
        'Good value for money.',
        'Works as expected.',
        'Could be better, but acceptable.',
        'Excellent quality and fast delivery.',
        'Not bad, but had some issues.',
        'Perfect for my needs.',
        'Would buy again.',
        'Average product, nothing special.',
        'Very satisfied with this purchase.',
      ];

      for (let i = 0; i < count; i++) {
        const user = users[i % users.length];
        const product = products[i % products.length];
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars

        await prisma.review.upsert({
          where: { userId_productId: { userId: user.id, productId: product.id } },
          update: {},
          create: {
            userId: user.id,
            productId: product.id,
            rating,
            comment: comments[i % comments.length],
            isActive: true,
          },
        });

        log('green', `✓ Created review: ${user.username} -> ${product.name} (${rating}★)`);
      }

      log('cyan', `\n✅ Generated ${count} test reviews`);
      break;
    }
    default:
      console.log('Generate commands: products [count], orders [count], customers [count], reviews [count]');
  }
}

function showHelp() {
  console.log(`
E-Commerce CLI Debug & Dev Tool

Usage: node cli.js <command> [options]

Commands:
  user <action>              - User management
    list                     - List users
    create <u> <e> [p] [r]   - Create user (username, email, password, role)
    show <id>                - Show user details
    reset-password <id> <p>  - Reset user password
    delete <id>              - Deactivate user

  order <action>            - Order management
    list [status]           - List orders
    show <id>               - Show order details
    update-status <id> <s>  - Update order status
    cancel <id>             - Cancel order

  payment <action>          - Payment management
    list                    - List payments
    show <id>               - Show payment details
    check <id>              - Check payment status
    refund <id> [amount]    - Refund payment

  product <action>          - Product management
    list                    - List products
    low-stock               - Show low stock products

  db <action>               - Database management
    status                  - Show database stats
    reset                   - Reset database (dangerous!)
    seed                    - Seed sample data

  chat <action>             - Chat management
    history [user_id]       - Show chat history
    clear [user_id]         - Clear chat history

  logs <action>             - View logs
    recent [count]          - Recent transactions
    errors                  - Error logs

  debug <action> <id>       - Debug commands
    payment <order_id>      - Debug payment issue
    order <order_id>        - Debug order issue
    user <user_id>          - Debug user issue

  health <action>           - System health checks
    check                   - Full system health check
    orders                  - Order status summary
    reservations            - Show stock reservations

  test <action>             - Run tests
    api                     - Test API endpoints
    seed                    - Test seed script
    db                      - Test database operations

  generate <action> [count] - Generate test data
    products [count]        - Generate test products
    orders [count]          - Generate test orders
    customers [count]       - Generate test customers
    reviews [count]         - Generate test reviews

  help                      - Show this help
  `);
}

main();