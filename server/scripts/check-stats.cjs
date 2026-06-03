const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const total = await p.product.count();
  const featured = await p.product.count({ where: { isFeatured: true } });
  const inStock = await p.product.count({ where: { stock: { gt: 0 } } });
  const cats = await p.category.count();
  const brands = await p.brand.count();
  const users = await p.user.count();
  const orders = await p.order.count();
  console.log('Products:', total, '| Featured:', featured, '| InStock:', inStock);
  console.log('Categories:', cats, '| Brands:', brands);
  console.log('Users:', users, '| Orders:', orders);
  const featuredList = await p.product.findMany({ where: { isFeatured: true }, select: { name: true, price: true, stock: true } });
  console.log('\nFeatured products:');
  featuredList.forEach(f => console.log('  -', f.name, '| RM', f.price, '| stock:', f.stock));
  await p.$disconnect();
})();
