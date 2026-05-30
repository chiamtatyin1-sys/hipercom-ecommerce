import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/email.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const orderCancelLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many order cancellations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}${random}`;
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (req.user.role === 'customer') {
      where.userId = req.user.id;
    } else if (req.user.role === 'seller') {
      // Seller sees orders containing their products
      where.items = { some: { product: { userId: req.user.id } } };
    }
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, email: true, phone: true } },
          items: { include: { product: { select: { name: true, images: true } }, variant: true } },
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true, images: true, sku: true } }, variant: true } },
        payment: true,
        referral: true,
        coupon: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check access
    if (req.user.role === 'customer' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: {
        items: { include: { product: { select: { name: true } }, variant: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { items, deliveryType, pickupBranchId, referralCode, couponCode, addressId, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Get cart items and verify stock
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: req.user.id,
        id: { in: items.map(i => i.cartItemId) },
      },
      include: {
        product: true,
        variant: true,
      },
    });

    if (cartItems.length !== items.length) {
      return res.status(400).json({ error: 'Some items not found in cart' });
    }

    // Check stock and calculate prices
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const requestedQty = items.find(i => i.cartItemId === cartItem.id)?.quantity || cartItem.quantity;

      let availableStock = cartItem.product.stock - cartItem.product.reservedStock;
      if (cartItem.variantId) {
        availableStock = cartItem.variant.stock - cartItem.variant.reservedStock;
      }

      if (availableStock < requestedQty) {
        return res.status(400).json({ error: `Insufficient stock for ${cartItem.product.name}` });
      }

      const unitPrice = cartItem.product.price + (cartItem.variant?.additionalPrice || 0);
      subtotal += unitPrice * requestedQty;

      orderItems.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: requestedQty,
        price: unitPrice,
      });
    }

    // Apply coupon discount
    let couponDiscount = 0;
    let couponId = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive && (!coupon.endDate || new Date(coupon.endDate) >= new Date()) && (coupon.usageLimit === 0 || coupon.usedCount < coupon.usageLimit) && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          couponDiscount = subtotal * (coupon.discountValue / 100);
          if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
        } else {
          couponDiscount = coupon.discountValue;
        }
        couponDiscount = Math.min(couponDiscount, subtotal);
        couponId = coupon.id;
      }
    }

    // Apply referral discount
    let referralDiscount = 0;
    let referralId = null;
    if (referralCode) {
      const referralConfig = await prisma.referralConfig.findFirst({
        where: { isActive: true },
      });

      if (referralConfig && referralConfig.refereeDiscountType) {
        if (referralConfig.refereeDiscountType === 'percentage') {
          referralDiscount = subtotal * (referralConfig.refereeDiscountValue / 100);
        } else {
          referralDiscount = Math.min(referralConfig.refereeDiscountValue, subtotal);
        }
      }
    }

    // Get shipping address
    let shippingAddress = null;
    let shippingPhone = null;
    let shippingName = null;

    if (deliveryType === 'shipping' && addressId) {
      const address = await prisma.address.findFirst({
        where: { id: addressId, userId: req.user.id },
      });

      if (address) {
        shippingAddress = `${address.address}, ${address.city}, ${address.state} ${address.postalCode}`;
        shippingPhone = address.phone;
        shippingName = address.name;
      }
    }

    const taxConfig = await prisma.taxConfig.findFirst({ where: { isActive: true } });
    const taxRate = taxConfig?.rate || 0;
    const tax = (subtotal - couponDiscount - referralDiscount) * (taxRate / 100);
    const shippingCost = deliveryType === 'shipping' ? 5 : 0;
    const total = subtotal - couponDiscount - referralDiscount + tax + shippingCost;

    const orderNumber = generateOrderNumber();

    // Create order with stock reservation
    const order = await prisma.$transaction(async (tx) => {
      // Reserve stock
      for (const item of orderItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reservedStock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { increment: item.quantity } },
          });
        }
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user.id,
          deliveryType,
          pickupBranchId: deliveryType === 'pickup' ? pickupBranchId : null,
          subtotal,
          discount: couponDiscount,
          referralDiscount,
          shippingCost,
          tax,
          total,
          shippingAddress,
          shippingPhone,
          shippingName,
          notes,
          couponId,
          items: {
            create: orderItems,
          },
          statusHistory: {
            create: {
              oldStatus: 'none',
              newStatus: 'pending',
              notes: 'Order created',
            },
          },
        },
        include: {
          items: { include: { product: true, variant: true } },
          coupon: true,
          statusHistory: true,
        },
      });

      return newOrder;
    });

    // Increment coupon usage
    if (couponId) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    // Send order confirmation email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user) {
      sendOrderConfirmation(order, user).catch(err => console.error('Order confirmation email error:', err.message));
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id/status', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldStatus = order.status;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: req.params.id },
        data: {
          status,
          statusHistory: {
            create: {
              oldStatus,
              newStatus: status,
              notes: notes || `Status changed by ${req.user.username}`,
              userId: req.user.id,
            },
          },
        },
        include: { items: true, statusHistory: true },
      });

      // Handle stock changes
      if (status === 'cancelled') {
        // Release reserved stock
        for (const item of updated.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { reservedStock: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { reservedStock: { decrement: item.quantity } },
            });
          }
        }
      } else if (status === 'paid' && oldStatus === 'pending') {
        // Convert reserved stock to actual deduction
        for (const item of updated.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { decrement: item.quantity },
                reservedStock: { decrement: item.quantity },
              },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                reservedStock: { decrement: item.quantity },
              },
            });
          }
        }
      }

      return updated;
    });

    // Send status update email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (user) {
      sendOrderStatusUpdate(updatedOrder, user).catch(err => console.error('Status update email error:', err.message));
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Customer cancel order (pending only)
router.delete('/:id', authenticate, orderCancelLimiter, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only order owner can cancel
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only pending orders can be cancelled by customer
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    // Cancel order and release reserved stock
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: req.params.id },
        data: {
          status: 'cancelled',
          statusHistory: {
            create: {
              oldStatus: 'pending',
              newStatus: 'cancelled',
              notes: 'Cancelled by customer',
              userId: req.user.id,
            },
          },
        },
      });

      // Release reserved stock
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reservedStock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { decrement: item.quantity } },
          });
        }
      }
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get order status history
router.get('/:id/status-history', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, username: true, role: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check access
    if (req.user.role === 'customer' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ statusHistory: order.statusHistory });
  } catch (error) {
    console.error('Get status history error:', error);
    res.status(500).json({ error: 'Failed to get status history' });
  }
});

export default router;