import prisma from '../src/db/prisma.js';

const brandLogos = {
  'Samsung': '/brands/samsung.svg',
  'Apple': '/brands/apple.svg',
  'Nike': '/brands/nike.svg',
  'Adidas': '/brands/adidas.svg',
  'Sony': '/brands/sony.svg',
  'LG': '/brands/lg.svg',
  'Xiaomi': '/brands/xiaomi.svg',
  'IKEA': '/brands/ikea.svg',
  'Unilever': '/brands/unilever.svg',
  'Nestle': '/brands/nestle.svg',
};

async function updateBrands() {
  console.log('Updating brand logos...');

  for (const [name, logo] of Object.entries(brandLogos)) {
    try {
      const updated = await prisma.brand.updateMany({
        where: { name },
        data: { logo },
      });
      if (updated.count > 0) {
        console.log(`✅ ${name} → ${logo}`);
      } else {
        console.log(`⚠️  ${name} not found, creating...`);
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await prisma.brand.create({
          data: { name, slug, logo },
        });
        console.log(`✅ ${name} created with logo`);
      }
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
    }
  }

  await prisma.$disconnect();
  console.log('Done!');
}

updateBrands();
