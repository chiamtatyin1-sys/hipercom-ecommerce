import express from 'express';
import prisma from '../db/prisma.js';

const router = express.Router();

// Generate XML sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    
    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }
    });

    // Get all categories
    const categories = await prisma.category.findMany({
      select: { slug: true }
    });

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Static pages
    const staticPages = ['', '/products', '/about', '/contact'];
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Product pages
    products.forEach(product => {
      xml += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    // Category pages
    categories.forEach(cat => {
      xml += `
  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
