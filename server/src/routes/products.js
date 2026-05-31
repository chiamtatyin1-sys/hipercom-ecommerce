import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { aiSearch, aiSearchWithLLM } from '../services/aiSearch.js';

const router = express.Router();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'products');
    import('fs').then(fs => fs.default.mkdirSync(uploadDir, { recursive: true }));
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
});

// Helper to safely parse images field
const parseImages = (imgData) => {
  if (!imgData) return [];
  if (Array.isArray(imgData)) return imgData;
  try { return JSON.parse(imgData); } catch { return imgData.startsWith?.('http') ? [imgData] : []; }
};

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sort = 'newest',
      featured,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: true };

    // Seller data isolation: only show seller's own products
    if (req.user?.role === 'seller') {
      where.userId = req.user.id;
    }

    if (category) where.categoryId = category;
    if (brand) where.brandId = brand;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'popular') orderBy = { orderItems: { _count: 'desc' } };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          brand: { select: { id: true, name: true, logo: true } },
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true }, select: { id: true, variantName: true, variantValue: true, additionalPrice: true, stock: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Parse images from JSON string to array
    const parseImages = (imgData) => {
      if (!imgData) return [];
      if (Array.isArray(imgData)) return imgData;
      try { return JSON.parse(imgData); } catch { return imgData.startsWith('http') ? [imgData] : []; }
    };

    const parsedProducts = products.map(p => ({
      ...p,
      images: parseImages(p.images),
    }));

    res.json({
      products: parsedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

router.get('/search/advanced', async (req, res) => {
  try {
    const { q, category, brand, minPrice, maxPrice, sort = 'relevance' } = req.query;

    const where = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { sku: { contains: q } },
      ];
    }
    if (category) where.categoryId = category;
    if (brand) where.brandId = brand;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const products = await prisma.product.findMany({
      where,
      take: 50,
      orderBy,
      include: {
        brand: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true } },
        variants: { where: { isActive: true } },
      },
    });

    res.json(products.map(p => ({ ...p, images: parseImages(p.images) })));
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/search/ai', async (req, res) => {
  try {
    const { q, useAI = 'false', page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const useLLM = useAI === 'true';
    const result = useLLM
      ? await aiSearchWithLLM(q, { page, limit })
      : await aiSearch(q, { page, limit });

    res.json(result);
  } catch (error) {
    console.error('AI search error:', error.message);
    console.error('AI search stack:', error.stack);
    res.status(500).json({ error: 'AI search failed', details: error.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug, isActive: true },
      include: {
        brand: true,
        category: { include: { parent: { select: { id: true, name: true } } } },
        variants: { where: { isActive: true } },
        stocks: { include: { warehouse: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Parse images
    const parsedProduct = {
      ...product,
      images: parseImages(product.images),
    };

    // Get recommendations
    const recommendations = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 6,
      include: { brand: { select: { name: true } } },
    });

    const parsedRecommendations = recommendations.map(r => ({
      ...r,
      images: parseImages(r.images),
    }));

    res.json({ product: parsedProduct, recommendations: parsedRecommendations });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        brand: true,
        category: true,
        variants: { where: { isActive: true } },
        stocks: { include: { warehouse: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ ...product, images: parseImages(product.images) });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

router.post('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      costPrice,
      images,
      sku,
      brandId,
      categoryId,
      warehouseId,
      stock,
      lowStockAlert,
      isFeatured,
      variants,
    } = req.body;

    // Check for duplicate slug or sku
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { sku }],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Slug or SKU already exists' });
    }

    const product = await prisma.product.create({
      data: {
        userId: req.user.id, // Track which seller created this product
        name,
        slug,
        description,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : 0,
        images: JSON.stringify(images || []),
        sku,
        brandId,
        categoryId,
        warehouseId,
        stock: parseInt(stock) || 0,
        lowStockAlert: lowStockAlert || 10,
        isFeatured: isFeatured || false,
        variants: variants?.length > 0 ? {
          create: variants.map(v => ({
            variantName: v.variantName,
            variantValue: v.variantValue,
            additionalPrice: v.additionalPrice || 0,
            sku: v.sku,
            stock: v.stock || 0,
          })),
        } : undefined,
      },
      include: {
        variants: true,
        brand: true,
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      costPrice,
      images,
      sku,
      brandId,
      categoryId,
      warehouseId,
      stock,
      lowStockAlert,
      isFeatured,
      isActive,
    } = req.body;

    // Check for duplicate slug or sku (excluding current product)
    if (slug || sku) {
      const existing = await prisma.product.findFirst({
        where: {
          id: { not: req.params.id },
          OR: [
            ...(slug ? [{ slug }] : []),
            ...(sku ? [{ sku }] : []),
          ],
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Slug or SKU already exists' });
      }
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
        ...(images && { images: JSON.stringify(images) }),
        ...(sku && { sku }),
        ...(brandId !== undefined && { brandId }),
        ...(categoryId !== undefined && { categoryId }),
        ...(warehouseId !== undefined && { warehouseId }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(lowStockAlert !== undefined && { lowStockAlert: parseInt(lowStockAlert) }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        variants: true,
        brand: true,
        category: true,
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Product deactivated' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/:id/variants', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { variantName, variantValue, additionalPrice, sku, stock } = req.body;

    const existingSku = await prisma.productVariant.findUnique({
      where: { sku },
    });

    if (existingSku) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: req.params.id,
        variantName,
        variantValue,
        additionalPrice: additionalPrice || 0,
        sku,
        stock: stock || 0,
      },
    });

    res.status(201).json(variant);
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ error: 'Failed to create variant' });
  }
});

router.put('/:id/variants/:variantId', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const variant = await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: req.body,
    });

    res.json(variant);
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

router.delete('/:id/variants/:variantId', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: { isActive: false },
    });

    res.json({ message: 'Variant deactivated' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
});

// Upload product images
router.post('/upload', authenticate, authorize('admin', 'seller'), upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
    const imageUrls = req.files.map(file => `${baseUrl}/uploads/products/${file.filename}`);

    res.json({
      message: `${req.files.length} image(s) uploaded`,
      images: imageUrls,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

export default router;