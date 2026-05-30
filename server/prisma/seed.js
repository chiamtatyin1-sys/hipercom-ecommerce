import prisma from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create Admin User
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('Hipercom123#', 10);
    const admin = await prisma.user.upsert({
      where: { username: 'hipercom' },
      update: {},
      create: {
        username: 'hipercom',
        email: 'admin@hipercom.com.my',
        password: adminPassword,
        role: 'admin',
        referralCode: 'ADMIN001',
        emailVerified: true,
      },
    });
    console.log(`✅ Admin created: ${admin.username}`);

    // 2. Create Categories
    console.log('Creating categories...');
    const categories = [
      { name: 'Electronics', slug: 'electronics', icon: '⚡' },
      { name: 'Fashion', slug: 'fashion', icon: '👕' },
      { name: 'Home & Living', slug: 'home-living', icon: '🏠' },
      { name: 'Sports', slug: 'sports', icon: '⚽' },
      { name: 'Books', slug: 'books', icon: '📚' },
      { name: 'Beauty', slug: 'beauty', icon: '💄' },
      { name: 'Food & Beverages', slug: 'food-beverages', icon: '🍔' },
      { name: 'Toys & Games', slug: 'toys-games', icon: '🎮' },
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const created = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
      createdCategories.push(created);
    }
    console.log(`✅ ${createdCategories.length} categories created`);

    // 3. Create Brands
    console.log('Creating brands...');
    const brands = [
      { name: 'Samsung', slug: 'samsung', logo: 'S' },
      { name: 'Apple', slug: 'apple', logo: 'A' },
      { name: 'Nike', slug: 'nike', logo: 'N' },
      { name: 'Adidas', slug: 'adidas', logo: 'A' },
      { name: 'Sony', slug: 'sony', logo: 'S' },
      { name: 'LG', slug: 'lg', logo: 'L' },
      { name: 'Xiaomi', slug: 'xiaomi', logo: 'X' },
      { name: 'IKEA', slug: 'ikea', logo: 'I' },
      { name: 'Unilever', slug: 'unilever', logo: 'U' },
      { name: 'Nestle', slug: 'nestle', logo: 'N' },
    ];

    const createdBrands = [];
    for (const brand of brands) {
      const created = await prisma.brand.upsert({
        where: { slug: brand.slug },
        update: {},
        create: brand,
      });
      createdBrands.push(created);
    }
    console.log(`✅ ${createdBrands.length} brands created`);

    // 4. Create Warehouse
    console.log('Creating warehouse...');
    const warehouse = await prisma.warehouse.upsert({
      where: { id: 'default-warehouse' },
      update: {},
      create: {
        id: 'default-warehouse',
        name: 'Main Warehouse',
        address: 'Kuala Lumpur, Malaysia',
        isDefault: true,
        isActive: true,
      },
    });
    console.log(`✅ Warehouse created: ${warehouse.name}`);

    // 5. Create Sample Products
    console.log('Creating sample products...');
    const products = [
      { name: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24', description: 'Latest flagship smartphone with AI features', price: 3999, costPrice: 2800, stock: 50, lowStockAlert: 10, categoryId: createdCategories[0].id, brandId: createdBrands[0].id, sku: 'SAM-S24-001', images: JSON.stringify(['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500']) },
      { name: 'iPhone 15 Pro', slug: 'iphone-15-pro', description: 'Apple\'s premium smartphone with titanium design', price: 5299, costPrice: 3800, stock: 30, lowStockAlert: 5, categoryId: createdCategories[0].id, brandId: createdBrands[1].id, sku: 'APL-IP15-001', images: JSON.stringify(['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500']) },
      { name: 'Nike Air Max 270', slug: 'nike-air-max-270', description: 'Comfortable running shoes with Max Air cushioning', price: 599, costPrice: 350, stock: 100, lowStockAlert: 20, categoryId: createdCategories[1].id, brandId: createdBrands[2].id, sku: 'NIK-AM270-001', images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500']) },
      { name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', description: 'Premium noise-cancelling headphones', price: 1499, costPrice: 900, stock: 40, lowStockAlert: 10, categoryId: createdCategories[0].id, brandId: createdBrands[4].id, sku: 'SNY-WH1000-001', images: JSON.stringify(['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500']) },
      { name: 'IKEA MALM Desk', slug: 'ikea-malm-desk', description: 'Modern desk with clean lines and cable management', price: 399, costPrice: 200, stock: 25, lowStockAlert: 5, categoryId: createdCategories[2].id, brandId: createdBrands[7].id, sku: 'IKE-MALM-001', images: JSON.stringify(['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500']) },
      { name: 'Adidas Ultraboost', slug: 'adidas-ultraboost', description: 'High-performance running shoes with Boost technology', price: 799, costPrice: 450, stock: 75, lowStockAlert: 15, categoryId: createdCategories[1].id, brandId: createdBrands[3].id, sku: 'ADI-UB-001', images: JSON.stringify(['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500']) },
      { name: 'Xiaomi Robot Vacuum', slug: 'xiaomi-robot-vacuum', description: 'Smart robot vacuum with mopping function', price: 1299, costPrice: 750, stock: 20, lowStockAlert: 5, categoryId: createdCategories[2].id, brandId: createdBrands[6].id, sku: 'XIA-RV-001', images: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500']) },
      { name: 'LG OLED TV 55"', slug: 'lg-oled-tv-55', description: '4K OLED TV with perfect blacks and vibrant colors', price: 4999, costPrice: 3200, stock: 10, lowStockAlert: 3, categoryId: createdCategories[0].id, brandId: createdBrands[5].id, sku: 'LG-OLED55-001', images: JSON.stringify(['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500']) },
      { name: 'Dove Body Wash', slug: 'dove-body-wash', description: 'Moisturizing body wash for soft skin', price: 19.90, costPrice: 10, stock: 200, lowStockAlert: 50, categoryId: createdCategories[5].id, brandId: createdBrands[8].id, sku: 'UNL-DOVE-001', images: JSON.stringify(['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500']) },
      { name: 'Nescafe Gold', slug: 'nescafe-gold', description: 'Premium instant coffee blend', price: 24.90, costPrice: 12, stock: 150, lowStockAlert: 30, categoryId: createdCategories[6].id, brandId: createdBrands[9].id, sku: 'NST-NC-001', images: JSON.stringify(['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500']) },
    ];

    const createdProducts = [];
    for (const prod of products) {
      const created = await prisma.product.upsert({
        where: { slug: prod.slug },
        update: {},
        create: {
          ...prod,
          warehouseId: warehouse.id,
          isActive: true,
          isFeatured: Math.random() > 0.5,
        },
      });
      createdProducts.push(created);
    }
    console.log(`✅ ${createdProducts.length} products created`);

    // 6. Create Tax Config
    console.log('Creating tax config...');
    await prisma.taxConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'SST',
        rate: 6,
        isActive: true,
      },
    });
    console.log('✅ Tax config created');

    // 7. Create Referral Config
    console.log('Creating referral config...');
    await prisma.referralConfig.upsert({
      where: { sellerId: 'default' },
      update: {},
      create: {
        sellerId: 'default',
        referrerRewardType: 'percentage',
        referrerRewardValue: 5,
        refereeDiscountType: 'percentage',
        refereeDiscountValue: 10,
        minOrderAmount: 50,
        maxUses: 0,
        isActive: true,
      },
    });
    console.log('✅ Referral config created');

    // 8. Create Sample Coupon
    console.log('Creating sample coupon...');
    await prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 100,
        maxDiscount: 50,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        applicableTo: 'all',
        applicableIds: '[]',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ Sample coupon created');

    // 9. Create Settings
    console.log('Creating settings...');
    const settings = [
      { key: 'ai_enabled', value: 'true' },
      { key: 'ai_provider', value: 'openrouter' },
      { key: 'ai_name', value: 'JARVIS' },
      { key: 'site_name', value: 'HiperCom' },
      { key: 'site_description', value: 'Your trusted online shopping destination in Malaysia' },
      { key: 'currency', value: 'MYR' },
      { key: 'shipping_free_threshold', value: '100' },
      { key: 'shipping_flat_rate', value: '5' },
    ];

    for (const setting of settings) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }
    console.log(`✅ ${settings.length} settings created`);

    console.log('\n🎉 Database seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Username: hipercom');
    console.log('   Password: Hipercom123#');
    console.log('\n📊 Summary:');
    console.log(`   - 1 Admin User`);
    console.log(`   - ${createdCategories.length} Categories`);
    console.log(`   - ${createdBrands.length} Brands`);
    console.log(`   - 1 Warehouse`);
    console.log(`   - ${createdProducts.length} Products`);
    console.log(`   - 1 Tax Config`);
    console.log(`   - 1 Referral Config`);
    console.log(`   - 1 Coupon`);
    console.log(`   - ${settings.length} Settings`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
