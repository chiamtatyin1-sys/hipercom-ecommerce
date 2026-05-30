import prisma from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from '../middleware/auth.js';

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

const productTemplates = [
  { name: 'Wireless Mouse', price: 89.90, category: 'Electronics', brand: 'Logitech' },
  { name: 'Mechanical Keyboard', price: 299.90, category: 'Electronics', brand: 'Corsair' },
  { name: 'USB-C Hub', price: 149.90, category: 'Electronics', brand: 'Anker' },
  { name: 'Monitor Stand', price: 199.90, category: 'Home & Living', brand: 'IKEA' },
  { name: 'Webcam HD', price: 249.90, category: 'Electronics', brand: 'Logitech' },
  { name: 'Bluetooth Speaker', price: 179.90, category: 'Electronics', brand: 'JBL' },
  { name: 'Power Bank 20000mAh', price: 129.90, category: 'Electronics', brand: 'Xiaomi' },
  { name: 'Laptop Bag', price: 99.90, category: 'Fashion', brand: 'Samsonite' },
  { name: 'Screen Protector', price: 29.90, category: 'Electronics', brand: 'Spigen' },
  { name: 'Cable Organizer', price: 39.90, category: 'Electronics', brand: 'Anker' },
  { name: 'Desk Lamp LED', price: 159.90, category: 'Home & Living', brand: 'Philips' },
  { name: 'Noise Cancelling Earbuds', price: 399.90, category: 'Electronics', brand: 'Sony' },
  { name: 'Smart Watch', price: 899.90, category: 'Electronics', brand: 'Samsung' },
  { name: 'Portable SSD 1TB', price: 449.90, category: 'Electronics', brand: 'Samsung' },
  { name: 'Graphics Tablet', price: 599.90, category: 'Electronics', brand: 'Wacom' },
  { name: 'Gaming Chair', price: 799.90, category: 'Home & Living', brand: 'Secretlab' },
  { name: 'Standing Desk', price: 1299.90, category: 'Home & Living', brand: 'IKEA' },
  { name: 'Wireless Charger', price: 79.90, category: 'Electronics', brand: 'Anker' },
  { name: 'Docking Station', price: 699.90, category: 'Electronics', brand: 'CalDigit' },
  { name: 'External GPU', price: 1999.90, category: 'Electronics', brand: 'Razer' },
];

const customerNames = [
  'Ahmad bin Ali', 'Siti Nurhaliza', 'Lee Wei Ming', 'Priya Sharma',
  'Muhammad Faiz', 'Nurul Aisyah', 'Tan Mei Ling', 'Rajesh Kumar',
  'Hafizah Yusof', 'Chong Wei Keat', 'Aisha Rahman', 'Kumar Selvam',
];

const reviewComments = [
  'Great product, highly recommended!',
  'Good value for money.',
  'Works as expected, no complaints.',
  'Could be better, but acceptable for the price.',
  'Excellent quality and fast delivery!',
  'Not bad, but had some minor issues.',
  'Perfect for my needs, very satisfied.',
  'Would definitely buy again.',
  'Average product, nothing special.',
  'Very satisfied with this purchase!',
  'Exceeded my expectations!',
  'Good build quality and design.',
];

async function generateTestData(config = {}) {
  const {
    customers = 10,
    products = 20,
    orders = 15,
    reviews = 20,
    coupons = 3,
  } = config;

  log('cyan', '\n🎲 Generating Test Data...\n');

  // Get existing data
  const categories = await prisma.category.findMany();
  const brands = await prisma.brand.findMany();
  const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } });

  if (categories.length === 0 || brands.length === 0) {
    log('red', '✗ Need categories and brands first. Run: npm run db:seed');
    return;
  }

  // 1. Generate Customers
  log('blue', `\n👥 Generating ${customers} customers...`);
  const createdCustomers = [];
  for (let i = 0; i < customers; i++) {
    const name = customerNames[i % customerNames.length] + (i >= customerNames.length ? ` ${i}` : '');
    const username = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
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

    createdCustomers.push(user);
    log('green', `  ✓ ${username} (${email})`);
  }

  // 2. Generate Products
  log('blue', `\n📦 Generating ${products} products...`);
  const createdProducts = [];
  for (let i = 0; i < products; i++) {
    const template = productTemplates[i % productTemplates.length];
    const suffix = i >= productTemplates.length ? ` v${Math.floor(i / productTemplates.length) + 1}` : '';
    const name = template.name + suffix;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const price = template.price + (Math.random() * 50 - 25);
    const stock = Math.floor(Math.random() * 100) + 10;

    const category = categories.find(c => c.name === template.category) || categories[0];
    const brand = brands.find(b => b.name === template.brand) || brands[0];

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description: `High quality ${name.toLowerCase()} for everyday use.`,
        price: Math.round(price * 100) / 100,
        costPrice: Math.round(price * 0.6 * 100) / 100,
        stock,
        lowStockAlert: 10,
        sku: `PRD-${Date.now().toString(36).toUpperCase()}-${i}`,
        categoryId: category.id,
        brandId: brand.id,
        warehouseId: warehouse?.id,
        isActive: true,
        isFeatured: Math.random() > 0.7,
        images: JSON.stringify(['https://via.placeholder.com/300']),
      },
    });

    createdProducts.push(product);
    log('green', `  ✓ ${name} (RM ${product.price.toFixed(2)})`);
  }

  // 3. Generate Orders
  log('blue', `\n🛒 Generating ${orders} orders...`);
  const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
  const deliveryTypes = ['shipping', 'pickup'];

  for (let i = 0; i < orders; i++) {
    const customer = createdCustomers[i % createdCustomers.length];
    const product = createdProducts[i % createdProducts.length];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const subtotal = product.price * quantity;
    const tax = subtotal * 0.06;
    const shipping = Math.random() > 0.5 ? 5 : 0;
    const total = subtotal + tax + shipping;
    const status = statuses[i % statuses.length];
    const deliveryType = deliveryTypes[i % deliveryTypes.length];

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now().toString(36).toUpperCase()}-${i}`,
        userId: customer.id,
        status,
        deliveryType,
        subtotal,
        tax,
        shippingCost: shipping,
        total,
        shippingAddress: deliveryType === 'shipping' ? `${i + 1} Test Street, Kuala Lumpur, 50000` : null,
        shippingPhone: '+60123456789',
        shippingName: customer.username,
        paymentStatus: status === 'pending' ? 'unpaid' : 'paid',
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
            notes: 'Test order created via data generator',
          },
        },
      },
    });

    log('green', `  ✓ ${order.orderNumber} (${status}, RM ${total.toFixed(2)})`);
  }

  // 4. Generate Reviews
  log('blue', `\n⭐ Generating ${reviews} reviews...`);
  for (let i = 0; i < reviews; i++) {
    const customer = createdCustomers[i % createdCustomers.length];
    const product = createdProducts[i % createdProducts.length];
    const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars

    await prisma.review.upsert({
      where: {
        userId_productId: { userId: customer.id, productId: product.id },
      },
      update: {},
      create: {
        userId: customer.id,
        productId: product.id,
        rating,
        comment: reviewComments[i % reviewComments.length],
        isActive: true,
      },
    });

    log('green', `  ✓ ${customer.username} -> ${product.name} (${rating}★)`);
  }

  // 5. Generate Coupons
  log('blue', `\n🎫 Generating ${coupons} coupons...`);
  const couponTemplates = [
    { code: 'SAVE10', discountType: 'percentage', discountValue: 10, minOrderAmount: 100, description: '10% off orders above RM100' },
    { code: 'FLAT50', discountType: 'fixed', discountValue: 50, minOrderAmount: 200, description: 'RM50 off orders above RM200' },
    { code: 'WELCOME20', discountType: 'percentage', discountValue: 20, minOrderAmount: 50, description: '20% off for new customers' },
  ];

  for (let i = 0; i < coupons; i++) {
    const template = couponTemplates[i % couponTemplates.length];

    await prisma.coupon.upsert({
      where: { code: template.code },
      update: {},
      create: {
        ...template,
        maxDiscount: template.discountType === 'percentage' ? 100 : undefined,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        applicableTo: 'all',
        applicableIds: '[]',
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    log('green', `  ✓ ${template.code} - ${template.description}`);
  }

  // Summary
  log('cyan', '\n📊 Generation Summary:');
  console.table([
    { Entity: 'Customers', Count: customers },
    { Entity: 'Products', Count: products },
    { Entity: 'Orders', Count: orders },
    { Entity: 'Reviews', Count: reviews },
    { Entity: 'Coupons', Count: coupons },
  ]);

  log('green', '\n✅ Test data generation completed!\n');
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('generate-data.js')) {
  const config = {
    customers: parseInt(process.argv[2]) || 10,
    products: parseInt(process.argv[3]) || 20,
    orders: parseInt(process.argv[4]) || 15,
    reviews: parseInt(process.argv[5]) || 20,
    coupons: parseInt(process.argv[6]) || 3,
  };

  generateTestData(config)
    .then(() => process.exit(0))
    .catch(error => {
      log('red', `✗ Generation failed: ${error.message}`);
      process.exit(1);
    });
}

export default generateTestData;
