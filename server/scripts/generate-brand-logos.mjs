import { PrismaClient } from '@prisma/client';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const brandsDir = join(process.cwd(), '..', 'client', 'public', 'brands');

if (!existsSync(brandsDir)) mkdirSync(brandsDir, { recursive: true });

const colors = ['#e11d48','#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#4f46e5','#be185d','#65a30d'];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function createSvg(letter, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="64" fill="${color}"/>
  <text x="64" y="64" font-family="Arial,sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${letter}</text>
</svg>`;
}

(async () => {
  const brands = await prisma.brand.findMany();
  let created = 0;
  for (const brand of brands) {
    const filePath = join(brandsDir, `${brand.slug}.svg`);
    if (existsSync(filePath)) {
      console.log(`SKIP: ${brand.slug}.svg (exists)`);
      continue;
    }
    const letter = brand.name.charAt(0).toUpperCase();
    const color = getColor(brand.name);
    writeFileSync(filePath, createSvg(letter, color));
    console.log(`CREATED: ${brand.slug}.svg (${letter}, ${color})`);
    created++;
  }
  await prisma.$disconnect();
  console.log(`\nDone — created ${created} brand logos`);
})();
