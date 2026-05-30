import express from 'express';
import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import axios from 'axios';
import { earnPoints } from '../services/loyalty.js';
import { createNotification } from '../services/notifications.js';

const router = express.Router();

const HITPAY_API_URL = process.env.HITPAY_API_URL || 'https://api.sandbox.hit-pay.com';
const HITPAY_API_KEY = process.env.HITPAY_API_KEY;
const HITPAY_SALT = process.env.HITPAY_SALT;
const HITPAY_DEFAULT_LINK = process.env.HITPAY_DEFAULT_LINK;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

async function createHitPayPayment(order) {
  const paymentMethods = ['card', 'fpx'];

  const formData = new URLSearchParams();
  formData.append('amount', order.total.toString());
  formData.append('currency', 'MYR');
  paymentMethods.forEach(method => formData.append('payment_methods[]', method));
  formData.append('reference_number', order.orderNumber);
  formData.append('email', order.user.email);
  formData.append('name', order.shippingName || order.user.username);
  formData.append('redirect_url', `${CLIENT_URL}/payment/complete?order=${order.orderNumber}`);
  formData.append('webhook_url', `${SERVER_URL}/api/payments/webhook`);

  const response = await axios.post(
    `${HITPAY_API_URL}/v1/payment-requests`,
    formData.toString(),
    {
      headers: {
        'X-BUSINESS-API-KEY': HITPAY_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

async function createQRPayment(order, paymentMethod = 'paynow_online') {
  const formData = new URLSearchParams();
  formData.append('amount', order.total.toString());
  formData.append('currency', 'MYR');
  formData.append('payment_methods[]', paymentMethod);
  formData.append('generate_qr', 'true');
  formData.append('reference_number', order.orderNumber);
  formData.append('email', order.user.email);
  formData.append('name', order.shippingName || order.user.username);
  formData.append('redirect_url', `${CLIENT_URL}/payment/complete?order=${order.orderNumber}`);
  formData.append('webhook_url', `${SERVER_URL}/api/payments/webhook`);

  const response = await axios.post(
    `${HITPAY_API_URL}/v1/payment-requests`,
    formData.toString(),
    {
      headers: {
        'X-BUSINESS-API-KEY': HITPAY_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

router.post('/create/:orderId', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        user: true,
        items: { include: { product: true, variant: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const paymentData = await createHitPayPayment(order);

    // Update order with payment info
    await prisma.order.update({
      where: { id: order.id },
      data: {
        hitpayId: paymentData.id,
        hitpayUrl: paymentData.url,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        hitpayId: paymentData.id,
        amount: order.total,
        currency: 'MYR',
        status: 'pending',
      },
    });

    res.json({
      paymentUrl: paymentData.url,
      paymentRequestId: paymentData.id,
    });
  } catch (error) {
    console.error('Create payment error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.post('/create-qr/:orderId', authenticate, async (req, res) => {
  try {
    const { paymentMethod = 'paynow_online' } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { user: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const paymentData = await createQRPayment(order, paymentMethod);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        hitpayId: paymentData.id,
        paymentMethod,
      },
    });

    res.json({
      paymentRequestId: paymentData.id,
      qrCodeData: paymentData.qr_code_data,
      redirectUrl: paymentData.url,
    });
  } catch (error) {
    console.error('Create QR payment error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create QR payment' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { reference, status, payment_request_id, amount, currency } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Reference required' });
    }

    const signature = req.headers['x-hitpay-signature'];
    if (HITPAY_SALT && signature) {
      const data = JSON.stringify(req.body);
      const expectedSignature = crypto.createHmac('sha256', HITPAY_SALT).update(data).digest('hex');
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature for order:', reference);
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: reference },
      include: { user: true, payment: true },
    });

    if (!order) {
      console.error('Order not found:', reference);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({ message: 'Order already processed' });
    }

    if (status === 'completed' || status === 'paid') {
      // Update order and handle stock in transaction
      await prisma.$transaction(async (tx) => {
        // Update order
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            status: 'paid',
            paidAt: new Date(),
            statusHistory: {
              create: {
                oldStatus: order.status,
                newStatus: 'paid',
                notes: 'Payment confirmed via HitPay webhook',
              },
            },
          },
        });

        // Update payment
        await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: 'completed',
            method: req.body.payment_method || 'card',
            webhookData: JSON.stringify(req.body),
          },
        });

        // Release reserved stock and deduct actual stock
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });

        for (const item of orderItems) {
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
      });

      // Record transaction for accounting
      await prisma.transaction.create({
        data: {
          type: 'income',
          category: 'sales',
          amount: parseFloat(amount),
          currency: currency || 'MYR',
          description: `Order ${order.orderNumber}`,
          orderId: order.id,
          reference: payment_request_id,
        },
      });

      // Process referral if applicable
      if (order.referralDiscount > 0 && order.user.referrerId) {
        const referralConfig = await prisma.referralConfig.findFirst({
          where: { isActive: true },
        });

        if (referralConfig) {
          const commission = order.referralDiscount * (referralConfig.referrerRewardValue / 100);

          await prisma.referral.create({
            data: {
              referrerId: order.user.referrerId,
              refereeId: order.userId,
              orderId: order.id,
              referralCode: order.user.referralCode,
              commissionType: referralConfig.referrerRewardType,
              commissionValue: referralConfig.referrerRewardValue,
              commissionAmount: commission,
              status: 'earned',
            },
          });

          // Add to referrer's wallet
          await prisma.user.update({
            where: { id: order.user.referrerId },
            data: { wallet: { increment: commission } },
          });
        }
      }

      // Earn loyalty points
      try {
        const pointsResult = await earnPoints(order.userId, order.id, order.total);
        if (pointsResult.points > 0) {
          await createNotification(
            order.userId,
            'Loyalty Points Earned!',
            `You earned ${pointsResult.points} points from order ${order.orderNumber}`,
            'success',
            '/loyalty'
          );
        }
      } catch (error) {
        console.error('Loyalty points error:', error);
      }

      // Create order notification
      try {
        await createNotification(
          order.userId,
          'Payment Confirmed',
          `Your order ${order.orderNumber} has been paid successfully. Total: RM ${order.total.toFixed(2)}`,
          'success',
          `/orders`
        );
      } catch (error) {
        console.error('Notification error:', error);
      }

      console.log(`Payment completed for order ${order.orderNumber}`);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              user: { select: { username: true, email: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

router.get('/status/:orderId', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        status: true,
        hitpayId: true,
        hitpayUrl: true,
        total: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

router.post('/refund/:orderId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { payment: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Order not paid' });
    }

    if (!order.payment?.hitpayId) {
      return res.status(400).json({ error: 'No payment to refund' });
    }

    // Call HitPay refund API
    const refundAmount = amount || order.total;
    const formData = new URLSearchParams();
    formData.append('amount', refundAmount.toString());
    formData.append('currency', 'MYR');
    formData.append('reference', `REF-${order.orderNumber}`);
    formData.append('reason', reason || 'Customer request');

    const response = await axios.post(
      `${HITPAY_API_URL}/v1/payment-requests/${order.payment.hitpayId}/refunds`,
      formData.toString(),
      {
        headers: {
          'X-BUSINESS-API-KEY': HITPAY_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'refunded',
        status: 'cancelled',
      },
    });

    // Update payment
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { status: 'refunded' },
    });

    // Create refund transaction
    await prisma.transaction.create({
      data: {
        type: 'expense',
        category: 'refund',
        amount: refundAmount,
        currency: 'MYR',
        description: `Refund for order ${order.orderNumber}`,
        orderId: order.id,
      },
    });

    res.json({ message: 'Refund processed', refundId: response.data.id });
  } catch (error) {
    console.error('Refund error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Refund failed' });
  }
});

router.get('/refunds', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const refunds = await prisma.transaction.findMany({
      where: { category: 'refund' },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    // Fetch order details separately
    const orderIds = refunds.filter(r => r.orderId).map(r => r.orderId);
    const orders = orderIds.length > 0 ? await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        orderNumber: true,
        user: { select: { username: true, email: true } },
      },
    }) : [];

    const orderMap = {};
    orders.forEach(o => { orderMap[o.id] = o; });

    const refundsWithOrders = refunds.map(r => ({
      ...r,
      order: r.orderId ? orderMap[r.orderId] : null,
    }));

    const total = await prisma.transaction.count({ where: { category: 'refund' } });

    res.json({
      refunds: refundsWithOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({ error: 'Failed to get refunds' });
  }
});

export default router;