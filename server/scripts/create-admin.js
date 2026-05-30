import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createMasterAdmin() {
  const hashedPassword = await bcrypt.hash('Hipercom123#', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'hipercom' },
    update: {},
    create: {
      username: 'hipercom',
      email: 'admin@hipercom.com',
      password: hashedPassword,
      role: 'admin',
      referralCode: 'MASTERADMIN'
    }
  });
  
  console.log('✅ Master admin created:', admin.username, '- Role:', admin.role);
}

createMasterAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());