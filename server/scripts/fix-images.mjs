import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fixes = [
  { slug: 'rubiks-cube-3x3', images: ['https://images.unsplash.com/photo-1580587771525-78db91a293d5?w=500', 'https://images.unsplash.com/photo-1591123720164-de1348028a82?w=500'] },
  { slug: 'lego-classic-bricks', images: ['https://images.unsplash.com/photo-1566150905458-1bf1dad18569?w=500', 'https://images.unsplash.com/photo-1472457897821-70d2460d267c?w=500'] },
  { slug: 'tealive-bubble-tea-kit', images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500'] },
  { slug: 'maybelline-mascara', images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500', 'https://images.unsplash.com/photo-1512496015851-a90fb38375bf?w=500'] },
  { slug: 'nike-strike-football', images: ['https://images.unsplash.com/photo-1614632537423-14e5a3d150c4?w=500', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500'] },
  { slug: 'adidas-water-bottle', images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500', 'https://images.unsplash.com/photo-1543168994-1d7f2e6e4f4c?w=500'] },
  { slug: 'yonex-nanoray-racket', images: ['https://images.unsplash.com/photo-1626296119179-4b2f2dd163ca?w=500', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=500'] },
  { slug: 'tefal-pan-set', images: ['https://images.unsplash.com/photo-1556909114-44e3e5005407?w=500', 'https://images.unsplash.com/photo-1584568694244-44cb20289e57?w=500'] },
  { slug: 'dyson-v8-vacuum', images: ['https://images.unsplash.com/photo-1558317374-a3089892385d?w=500', 'https://images.unsplash.com/photo-1567923616185-e16f36b4f553?w=500'] },
  { slug: 'samsung-galaxy-buds-fe', images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500', 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500'] },
];

async function fixImages() {
  console.log('Fixing broken image URLs...\n');
  
  for (const fix of fixes) {
    try {
      const updated = await prisma.product.update({
        where: { slug: fix.slug },
        data: { images: JSON.stringify(fix.images) },
      });
      console.log(`✅ ${updated.name}`);
    } catch (error) {
      console.error(`❌ ${fix.slug}: ${error.message}`);
    }
  }
  
  await prisma.$disconnect();
  console.log('\nDone!');
}

fixImages().catch(console.error);