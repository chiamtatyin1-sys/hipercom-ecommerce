import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function seedFromDummyJSON() {
  console.log('Fetching products from DummyJSON...');
  
  const response = await fetch('https://dummyjson.com/products?limit=30');
  const data = await response.json();
  const products = data.products;
  
  console.log(`Found ${products.length} products`);

  // Create Categories
  const categories = [
    { name: 'Laptops & Computers', slug: 'laptops', icon: 'laptop' },
    { name: 'Smartphones', slug: 'smartphones', icon: 'smartphone' },
    { name: 'Audio & Headphones', slug: 'audio', icon: 'headphones' },
    { name: 'Cameras', slug: 'cameras', icon: 'camera' },
    { name: 'Gaming', slug: 'gaming', icon: 'gamepad' },
    { name: 'Accessories', slug: 'accessories', icon: 'watch' },
    { name: 'Wearables', slug: 'wearables', icon: 'watch' },
    { name: 'Home & Living', slug: 'home', icon: 'home' },
  ];

  console.log('Creating categories...');
  const createdCategories = await Promise.all(
    categories.map(cat => 
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: { name: cat.name, slug: cat.slug, icon: cat.icon }
      })
    )
  );

  // Create Brands
  const brands = [
    { name: 'Apple', slug: 'apple', logo: 'https://logo.clearbit.com/apple.com' },
    { name: 'Samsung', slug: 'samsung', logo: 'https://logo.clearbit.com/samsung.com' },
    { name: 'Sony', slug: 'sony', logo: 'https://logo.clearbit.com/sony.com' },
    { name: 'LG', slug: 'lg', logo: 'https://logo.clearbit.com/lg.com' },
    { name: 'Asus', slug: 'asus', logo: 'https://logo.clearbit.com/asus.com' },
    { name: 'Dell', slug: 'dell', logo: 'https://logo.clearbit.com/dell.com' },
    { name: 'HP', slug: 'hp', logo: 'https://logo.clearbit.com/hp.com' },
    { name: 'Logitech', slug: 'logitech', logo: 'https://logo.clearbit.com/logitech.com' },
    { name: 'JBL', slug: 'jbl', logo: 'https://logo.clearbit.com/jbl.com' },
    { name: 'Xiaomi', slug: 'xiaomi', logo: 'https://logo.clearbit.com/xiaomi.com' },
  ];

  console.log('Creating brands...');
  const createdBrands = await Promise.all(
    brands.map(brand => 
      prisma.brand.upsert({
        where: { slug: brand.slug },
        update: {},
        create: { name: brand.name, slug: brand.slug, logo: brand.logo }
      })
    )
  );

  // Create default warehouse
  console.log('Creating warehouse...');
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'default-warehouse' },
    update: {},
    create: {
      id: 'default-warehouse',
      name: 'Main Warehouse',
      address: 'Kuala Lumpur, Malaysia',
      isDefault: true
    }
  });

  // Map categories
  const categoryMap = {
    'laptops': createdCategories[0],
    'smartphones': createdCategories[1],
    'audio': createdCategories[2],
    'cameras': createdCategories[3],
    'gaming': createdCategories[4],
    'accessories': createdCategories[5],
    'wearables': createdCategories[6],
    'home': createdCategories[7],
  };

  // Map brands
  const brandMap = {};
  createdBrands.forEach(b => { brandMap[b.name.toLowerCase()] = b; });

  // Create products
  console.log('Creating products...');
  let createdCount = 0;
  
  for (const p of products) {
    try {
      // Find matching category
      let categoryId = createdCategories[5].id; // default to accessories
      const catName = p.category.toLowerCase();
      if (catName.includes('laptop') || catName.includes('computer')) categoryId = categoryMap['laptops'].id;
      else if (catName.includes('smartphone') || catName.includes('phone')) categoryId = categoryMap['smartphones'].id;
      else if (catName.includes('audio') || catName.includes('headphone')) categoryId = categoryMap['audio'].id;
      else if (catName.includes('camera')) categoryId = categoryMap['cameras'].id;
      else if (catName.includes('gaming') || catName.includes('game')) categoryId = categoryMap['gaming'].id;
      else if (catName.includes('watch') || catName.includes('wearable')) categoryId = categoryMap['wearables'].id;

      // Find matching brand
      let brandId = null;
      const titleLower = p.title.toLowerCase();
      for (const [name, brand] of Object.entries(brandMap)) {
        if (titleLower.includes(name)) {
          brandId = brand.id;
          break;
        }
      }

      const slug = slugify(p.title, { lower: true }) + '-' + Date.now();

      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          name: p.title,
          slug,
          description: p.description,
          price: p.price,
          costPrice: p.price * 0.7,
          images: JSON.stringify(p.images || [p.thumbnail]),
          sku: p.sku || `SKU-${p.id}`,
          categoryId,
          brandId,
          warehouseId: warehouse.id,
          stock: p.stock || 50,
          lowStockAlert: 10,
          isActive: true,
          isFeatured: p.rating >= 4.5,
        }
      });
      createdCount++;
    } catch (err) {
      console.log(`Skipped ${p.title}: ${err.message}`);
    }
  }

  console.log(`✅ Created ${createdCount} products!`);
  console.log(`✅ Created ${createdCategories.length} categories`);
  console.log(`✅ Created ${createdBrands.length} brands`);

  // Create referral config
  await prisma.referralConfig.upsert({
    where: { sellerId: 'default' },
    update: {},
    create: {
      sellerId: 'default',
      referrerRewardType: 'percentage',
      referrerRewardValue: 5,
      refereeDiscountType: 'percentage',
      refereeDiscountValue: 10,
      minOrderAmount: 0,
      maxUses: 0,
      isActive: true,
    }
  });

  console.log('✅ Referral config created');
  console.log('\n🎉 Seed completed!');
}

seedFromDummyJSON()
  .catch(console.error)
  .finally(() => prisma.$disconnect());