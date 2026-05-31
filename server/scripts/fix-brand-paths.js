import prisma from '../src/db/prisma.js';

async function fixPaths() {
  console.log('Updating brand logo paths from /uploads/brands/ to /brands/...');

  const brands = await prisma.brand.findMany();
  for (const brand of brands) {
    if (brand.logo && brand.logo.startsWith('/uploads/brands/')) {
      const newPath = brand.logo.replace('/uploads/brands/', '/brands/');
      await prisma.brand.update({
        where: { id: brand.id },
        data: { logo: newPath },
      });
      console.log(`✅ ${brand.name}: ${brand.logo} → ${newPath}`);
    }
  }

  await prisma.$disconnect();
  console.log('Done!');
}

fixPaths();
