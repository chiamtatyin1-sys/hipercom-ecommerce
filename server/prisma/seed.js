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
      { name: 'Samsung', slug: 'samsung', logo: '/brands/samsung.svg' },
      { name: 'Apple', slug: 'apple', logo: '/brands/apple.svg' },
      { name: 'Nike', slug: 'nike', logo: '/brands/nike.svg' },
      { name: 'Adidas', slug: 'adidas', logo: '/brands/adidas.svg' },
      { name: 'Sony', slug: 'sony', logo: '/brands/sony.svg' },
      { name: 'LG', slug: 'lg', logo: '/brands/lg.svg' },
      { name: 'Xiaomi', slug: 'xiaomi', logo: '/brands/xiaomi.svg' },
      { name: 'IKEA', slug: 'ikea', logo: '/brands/ikea.svg' },
      { name: 'Unilever', slug: 'unilever', logo: '/brands/unilever.svg' },
      { name: 'Nestle', slug: 'nestle', logo: '/brands/nestle.svg' },
      { name: 'Dyson', slug: 'dyson', logo: '/brands/dyson.svg' },
      { name: 'Tefal', slug: 'tefal', logo: '/brands/tefal.svg' },
      { name: 'Yonex', slug: 'yonex', logo: '/brands/yonex.svg' },
      { name: 'Decathlon', slug: 'decathlon', logo: '/brands/decathlon.svg' },
      { name: "Levi's", slug: 'levis', logo: '/brands/levis.svg' },
      { name: 'Generic', slug: 'generic', logo: '/brands/generic.svg' },
      { name: 'Nivea', slug: 'nivea', logo: '/brands/nivea.svg' },
      { name: 'Maybelline', slug: 'maybelline', logo: '/brands/maybelline.svg' },
      { name: 'The Body Shop', slug: 'the-body-shop', logo: '/brands/the-body-shop.svg' },
      { name: 'Tealive', slug: 'tealive', logo: '/brands/tealive.svg' },
      { name: 'Munchys', slug: 'munchys', logo: '/brands/munchys.svg' },
      { name: 'LEGO', slug: 'lego', logo: '/brands/lego.svg' },
      { name: 'Rubiks', slug: 'rubiks', logo: '/brands/rubiks.svg' },
      { name: 'Hasbro', slug: 'hasbro', logo: '/brands/hasbro.svg' },
      { name: 'Funko', slug: 'funko', logo: '/brands/funko.svg' },
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

      // Electronics (add 2)
      { name: 'Xiaomi Redmi Note 13', slug: 'xiaomi-redmi-note-13', description: 'Mid-range smartphone featuring a 6.67-inch AMOLED display with 120Hz refresh rate. Powered by Snapdragon 685 processor with 8GB RAM and 256GB storage. Equipped with a 108MP triple camera system and 5000mAh battery.', price: 799, costPrice: 480, stock: 120, lowStockAlert: 15, categoryId: createdCategories[0].id, brandId: createdBrands[6].id, sku: 'XIA-RN13-001', images: JSON.stringify(['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500']) },
      { name: 'Samsung Galaxy Buds FE', slug: 'samsung-galaxy-buds-fe', description: 'True wireless earbuds with active noise cancellation and ambient sound mode. Features 6 speakers for rich bass and clear treble. IPX2 water resistant with up to 6 hours of playback on a single charge.', price: 299, costPrice: 180, stock: 80, lowStockAlert: 10, categoryId: createdCategories[0].id, brandId: createdBrands[0].id, sku: 'SAM-BUDS-001', images: JSON.stringify(['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500']) },

      // Fashion (add 3)
      { name: 'Nike Dri-FIT T-Shirt', slug: 'nike-dri-fit-tshirt', description: 'Lightweight athletic t-shirt made with Dri-FIT technology to wick sweat away from the body. Features a regular fit with a crew neck and is ideal for training and everyday wear. Available in multiple colours with reflective details.', price: 129, costPrice: 65, stock: 150, lowStockAlert: 20, categoryId: createdCategories[1].id, brandId: createdBrands[2].id, sku: 'NIK-DRIF-001', images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500']) },
      { name: 'Adidas Originals Backpack', slug: 'adidas-originals-backpack', description: 'Durable everyday backpack made from recycled polyester with a spacious main compartment and front zip pocket. Features padded adjustable shoulder straps and a laptop sleeve for up to 15-inch devices.', price: 249, costPrice: 140, stock: 60, lowStockAlert: 10, categoryId: createdCategories[1].id, brandId: createdBrands[3].id, sku: 'ADI-BPK-001', images: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=500']) },
      { name: "Levi's 501 Original Jeans", slug: 'levis-501-original', description: 'Iconic straight-leg jeans with a button fly and the classic Levi\'s fit. Made from premium 100% cotton denim that softens with wear. Features the signature red tab and leather patch for an authentic look.', price: 349, costPrice: 200, stock: 80, lowStockAlert: 15, categoryId: createdCategories[1].id, brandId: createdBrands[10].id, sku: 'LEV-501-001', images: JSON.stringify(['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500']) },

      // Home & Living (add 3)
      { name: 'IKEA KALLAX Shelf', slug: 'ikea-kallax-shelf', description: 'Versatile square shelf unit that works as a room divider or wall storage. Comes with 8 cube compartments that fit standard inserts and baskets. Made from particleboard with a durable laminate finish.', price: 299, costPrice: 160, stock: 40, lowStockAlert: 8, categoryId: createdCategories[2].id, brandId: createdBrands[7].id, sku: 'IKE-KLX-001', images: JSON.stringify(['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500', 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=500']) },
      { name: 'Dyson V8 Cordless Vacuum', slug: 'dyson-v8-vacuum', description: 'Powerful cordless stick vacuum with up to 40 minutes of fade-free runtime. Features strong suction with a digital motor and whole-machine filtration to capture allergens. Converts to a handheld for quick clean-ups.', price: 1499, costPrice: 900, stock: 25, lowStockAlert: 5, categoryId: createdCategories[2].id, brandId: createdBrands[11].id, sku: 'DYS-V8-001', images: JSON.stringify(['https://images.unsplash.com/photo-1570220876089-da6a3f786e64?w=500', 'https://images.unsplash.com/photo-1567923616185-e16f36b4f553?w=500']) },
      { name: 'Tefal Non-Stick Pan Set', slug: 'tefal-pan-set', description: 'Set of 3 non-stick frying pans (20cm, 24cm, 28cm) with Thermo-Spot heat indicator. Features a durable titanium-reinforced coating and cool-touch ergonomic handles. Dishwasher safe and suitable for all hob types.', price: 189, costPrice: 100, stock: 55, lowStockAlert: 10, categoryId: createdCategories[2].id, brandId: createdBrands[12].id, sku: 'TFL-PAN-001', images: JSON.stringify(['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500', 'https://images.unsplash.com/photo-1584568694244-44cb20289e57?w=500']) },

      // Sports (add 4)
      { name: 'Yonex Nanoray Racket', slug: 'yonex-nanoray-racket', description: 'Lightweight badminton racket designed for fast, aggressive play with a head-heavy balance. Built with Nanomesh technology for explosive power and precise control. Strung at 20-22 lbs and weighs approximately 85g.', price: 299, costPrice: 170, stock: 45, lowStockAlert: 8, categoryId: createdCategories[3].id, brandId: createdBrands[13].id, sku: 'YNX-NR-001', images: JSON.stringify(['https://images.unsplash.com/photo-1461896836934-bd45ba7d1f11?w=500', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500']) },
      { name: 'Adidas Sports Water Bottle', slug: 'adidas-water-bottle', description: 'BPA-free 750ml Tritan sports water bottle with a leak-proof push-pull cap. Features a wide mouth for easy filling and cleaning, plus measurement markings on the side. Lightweight and durable for gym and outdoor use.', price: 59, costPrice: 28, stock: 200, lowStockAlert: 30, categoryId: createdCategories[3].id, brandId: createdBrands[3].id, sku: 'ADI-BTL-001', images: JSON.stringify(['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500', 'https://images.unsplash.com/photo-1523362628745-0c100fb996e2?w=500']) },
      { name: 'Nike Strike Football', slug: 'nike-strike-football', description: 'Size 5 training football with a textured casing for improved grip and flight accuracy. Features a durable rubber bladder for consistent air retention. Suitable for training on grass and turf surfaces.', price: 129, costPrice: 60, stock: 70, lowStockAlert: 10, categoryId: createdCategories[3].id, brandId: createdBrands[2].id, sku: 'NIK-FB-001', images: JSON.stringify(['https://images.unsplash.com/photo-1614632537423-14e5a3d150c4?w=500', 'https://images.unsplash.com/photo-1575361208129-9a4f4f1287f0?w=500']) },
      { name: 'Decathlon Yoga Mat', slug: 'decathlon-yoga-mat', description: '6mm thick TPE yoga mat with a non-slip textured surface for excellent grip during poses. Features a lightweight and portable design with a carry strap included. Free from PVC, latex, and harmful chemicals.', price: 79, costPrice: 35, stock: 120, lowStockAlert: 15, categoryId: createdCategories[3].id, brandId: createdBrands[14].id, sku: 'DCL-YM-001', images: JSON.stringify(['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500']) },

      // Books (add 4)
      { name: 'Rich Dad Poor Dad', slug: 'rich-dad-poor-dad', description: 'Robert Kiyosaki\'s personal finance classic that teaches the importance of financial literacy, investing, and building wealth. Compares the mindsets of his two fathers and their approaches to money. A must-read for anyone seeking financial independence.', price: 35, costPrice: 18, stock: 100, lowStockAlert: 15, categoryId: createdCategories[4].id, brandId: createdBrands[15].id, sku: 'GEN-RDPD-001', images: JSON.stringify(['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500']) },
      { name: 'Atomic Habits', slug: 'atomic-habits', description: 'James Clear\'s guide to building good habits and breaking bad ones through small, incremental changes. Backed by scientific research and practical strategies for making lasting improvements. Covers the four laws of behaviour change.', price: 45, costPrice: 22, stock: 90, lowStockAlert: 15, categoryId: createdCategories[4].id, brandId: createdBrands[15].id, sku: 'GEN-ATH-001', images: JSON.stringify(['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500']) },
      { name: 'Malaysian Cooking Bible', slug: 'malaysian-cooking-bible', description: 'Comprehensive cookbook featuring over 200 authentic Malaysian recipes from all 13 states. Includes step-by-step instructions, ingredient lists, and stunning photography. Covers iconic dishes like nasi lemak, rendang, and char kway teow.', price: 59, costPrice: 30, stock: 60, lowStockAlert: 10, categoryId: createdCategories[4].id, brandId: createdBrands[15].id, sku: 'GEN-MCB-001', images: JSON.stringify(['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=500']) },
      { name: 'The Subtle Art of Not Giving a F*ck', slug: 'subtle-art-not-giving', description: 'Mark Manson\'s counterintuitive approach to living a good life by embracing our limitations and choosing what truly matters. A humorous and honest take on self-help that challenges conventional positivity. New York Times bestseller.', price: 39, costPrice: 20, stock: 80, lowStockAlert: 10, categoryId: createdCategories[4].id, brandId: createdBrands[15].id, sku: 'GEN-SANG-001', images: JSON.stringify(['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500']) },

      // Beauty (add 3)
      { name: 'Nivea Sunscreen SPF50', slug: 'nivea-sunscreen-spf50', description: 'Lightweight daily sunscreen with SPF50+ PA++++ broad-spectrum UVA and UVB protection. Enriched with hyaluronic acid and vitamin E for hydration. Non-greasy, fast-absorbing formula suitable for all skin types.', price: 39, costPrice: 18, stock: 180, lowStockAlert: 25, categoryId: createdCategories[5].id, brandId: createdBrands[16].id, sku: 'NIV-SPF50-001', images: JSON.stringify(['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500']) },
      { name: 'Maybelline Hyper Curl Mascara', slug: 'maybelline-mascara', description: 'Volumizing and lengthening mascara with a curved wand that lifts and curls lashes. Waterproof formula that lasts up to 18 hours without smudging. Buildable from natural to dramatic looks with multiple coats.', price: 45, costPrice: 20, stock: 130, lowStockAlert: 20, categoryId: createdCategories[5].id, brandId: createdBrands[17].id, sku: 'MAY-MSC-001', images: JSON.stringify(['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500', 'https://images.unsplash.com/photo-1631214500115-598fc2cb8ada?w=500']) },
      { name: 'The Body Shop Shower Gel', slug: 'body-shop-shower-gel', description: 'Refreshing shower gel enriched with community trade organic honey and vitamin E. Gently cleanses while leaving skin feeling soft and delicately scented. Available in a generous 250ml bottle for everyday use.', price: 29, costPrice: 12, stock: 160, lowStockAlert: 20, categoryId: createdCategories[5].id, brandId: createdBrands[18].id, sku: 'TBS-SHG-001', images: JSON.stringify(['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500']) },

      // Food & Beverages (add 3)
      { name: 'Milo Chocolate Drink 1kg', slug: 'milo-1kg', description: 'Malaysia\'s favourite chocolate malt beverage in a convenient 1kg refill pack. Packed with energy-giving nutrients including malt, cocoa, and vitamins. Perfect mixed with hot or cold milk for a delicious and nutritious drink.', price: 22, costPrice: 14, stock: 200, lowStockAlert: 30, categoryId: createdCategories[6].id, brandId: createdBrands[9].id, sku: 'NST-MLO-001', images: JSON.stringify(['https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500']) },
      { name: 'Tealive Bubble Tea Kit', slug: 'tealive-bubble-tea-kit', description: 'DIY bubble tea kit that lets you make authentic boba tea at home. Includes premium tapioca pearls, tea sachets, and flavoured syrup. Makes up to 6 servings with easy-to-follow instructions.', price: 35, costPrice: 16, stock: 90, lowStockAlert: 15, categoryId: createdCategories[6].id, brandId: createdBrands[19].id, sku: 'TLV-BTK-001', images: JSON.stringify(['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500', 'https://images.unsplash.com/photo-1525803377221-3e25c483b080?w=500']) },
      { name: "Munchy's Oat Krunch", slug: 'munchys-oat-krunch', description: 'Crunchy oat-based biscuits with a hint of honey and real oats for a wholesome snack. Baked to a golden crisp with a satisfying texture. Perfect with tea or coffee as a mid-day pick-me-up.', price: 12, costPrice: 7, stock: 180, lowStockAlert: 25, categoryId: createdCategories[6].id, brandId: createdBrands[20].id, sku: 'MCH-OK-001', images: JSON.stringify(['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500']) },

      // Toys & Games (add 4)
      { name: 'LEGO Classic Bricks', slug: 'lego-classic-bricks', description: 'Set of 484 LEGO bricks in 35 different colours for open-ended creative building. Includes windows, doors, eyes, and wheels to inspire imaginative play. Compatible with all LEGO sets for expanded possibilities.', price: 129, costPrice: 70, stock: 65, lowStockAlert: 10, categoryId: createdCategories[7].id, brandId: createdBrands[21].id, sku: 'LEG-CB-001', images: JSON.stringify(['https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=500', 'https://images.unsplash.com/photo-1472457897821-70d2460d267c?w=500']) },
      { name: "Rubik's Cube 3x3", slug: 'rubiks-cube-3x3', description: "The original 3x3 Rubik's Cube with smooth turning and stickerless design for long-lasting durability. Features a adjustable tension system for personalised feel. A challenging puzzle that has captivated millions worldwide since 1974.", price: 25, costPrice: 10, stock: 150, lowStockAlert: 20, categoryId: createdCategories[7].id, brandId: createdBrands[22].id, sku: 'RUB-3X3-001', images: JSON.stringify(['https://images.unsplash.com/photo-1584663693549-aa9f4b2b4dd7?w=500', 'https://images.unsplash.com/photo-1563911302504-4e0f2a4c93ce?w=500']) },
      { name: 'Monopoly Board Game', slug: 'monopoly-board-game', description: "The classic property trading game where players buy, sell, and trade to become the wealthiest player. Includes game board, tokens, cards, dice, and play money. A family favourite for game nights supporting 2-8 players.", price: 99, costPrice: 50, stock: 50, lowStockAlert: 8, categoryId: createdCategories[7].id, brandId: createdBrands[23].id, sku: 'HSB-MON-001', images: JSON.stringify(['https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=500', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500']) },
      { name: 'Funko Pop Marvel Figure', slug: 'funko-pop-marvel', description: 'Collectible vinyl figure of a Marvel superhero standing approximately 3.75 inches tall. Features the signature Funko Pop oversized head design and comes in a window display box. A must-have for Marvel fans and collectors.', price: 89, costPrice: 45, stock: 70, lowStockAlert: 10, categoryId: createdCategories[7].id, brandId: createdBrands[24].id, sku: 'FNK-MVL-001', images: JSON.stringify(['https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=500', 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500']) },
    ];

    const createdProducts = [];
    for (let i = 0; i < products.length; i++) {
      const created = await prisma.product.upsert({
        where: { slug: products[i].slug },
        update: {},
        create: {
          ...products[i],
          warehouseId: warehouse.id,
          isActive: true,
          isFeatured: i % 2 === 0,
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
