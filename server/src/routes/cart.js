import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    // For guest users, we'll need a session-based approach
    // For now, we'll require authentication for cart
    if (!req.user) {
      return res.status(401).json({ error: 'Please login to view cart' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            brand: { select: { name: true } },
            variants: { where: { isActive: true }, select: { id: true, variantName: true, variantValue: true, additionalPrice: true } },
          },
        },
        variant: true,
      },
    });

    const items = cartItems.map(item => {
      let parsedImages = [];
      try {
        parsedImages = typeof item.product.images === 'string' ? JSON.parse(item.product.images || '[]') : (item.product.images || []);
      } catch {
        parsedImages = item.product.images?.startsWith?.('http') ? [item.product.images] : [];
      }
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: parsedImages,
          stock: item.product.stock,
        },
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.variantName,
          value: item.variant.variantValue,
          additionalPrice: item.variant.additionalPrice,
          stock: item.variant.stock,
        } : null,
        totalPrice: (item.product.price + (item.variant?.additionalPrice || 0)) * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    res.json({ items, subtotal });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check stock
    let availableStock = product.stock;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        return res.status(404).json({ error: 'Variant not found' });
      }
      availableStock = variant.stock;
    }

    if (availableStock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: req.user.id,
        productId,
        variantId: variantId || null,
      },
    });

    let cartItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check stock
    const product = await prisma.product.findUnique({
      where: { id: cartItem.productId },
    });

    let maxStock = product.stock;
    if (cartItem.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: cartItem.variantId },
      });
      maxStock = variant?.stock || 0;
    }

    if (quantity > maxStock) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItem.id } });
      return res.json({ message: 'Item removed from cart' });
    }

    const updated = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

router.delete('/clear', authenticate, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;