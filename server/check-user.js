import prisma from './src/db/prisma.js';

const user = await prisma.user.findUnique({
  where: { username: 'hipercom' }
});

if (user) {
  console.log('User found:', { id: user.id, username: user.username, email: user.email, role: user.role });
} else {
  console.log('User not found');
}

await prisma.$disconnect();
