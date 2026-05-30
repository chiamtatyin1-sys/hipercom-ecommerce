import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        user: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).text('INVOICE', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Invoice #: ${order.orderNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-MY')}`, { align: 'right' });
    doc.moveDown(1);

    doc.fontSize(14).text('HiperCom Technology Sdn Bhd', { underline: true });
    doc.fontSize(10).text('123 Business Street');
    doc.text('Kuala Lumpur, 50000');
    doc.text('Malaysia');
    doc.text('Email: info@hipercom.com.my');
    doc.moveDown(1);

    doc.fontSize(14).text('Bill To:', { underline: true });
    doc.fontSize(10).text(order.shippingName || order.user.username);
    doc.text(order.shippingAddress || 'N/A');
    doc.text(order.shippingPhone || '');
    doc.moveDown(1);

    const tableTop = doc.y;
    const tableHeaders = ['Item', 'Qty', 'Price', 'Total'];
    const colWidths = [250, 60, 100, 100];
    let currentY = tableTop;

    doc.fontSize(10).font('Helvetica-Bold');
    let xPos = 50;
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos, currentY, { width: colWidths[i] });
      xPos += colWidths[i];
    });

    currentY += 20;
    doc.font('Helvetica');
    doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();

    order.items.forEach(item => {
      const itemTotal = item.quantity * item.price;
      xPos = 50;
      const itemName = item.variant ? `${item.product.name} (${item.variant.variantName})` : item.product.name;
      doc.text(itemName, xPos, currentY, { width: colWidths[0] });
      doc.text(item.quantity.toString(), xPos + colWidths[0], currentY, { width: colWidths[1] });
      doc.text(`RM ${item.price.toFixed(2)}`, xPos + colWidths[0] + colWidths[1], currentY, { width: colWidths[2] });
      doc.text(`RM ${itemTotal.toFixed(2)}`, xPos + colWidths[0] + colWidths[1] + colWidths[2], currentY, { width: colWidths[3] });
      currentY += 20;
    });

    currentY += 10;
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;

    const totalsX = 400;
    doc.fontSize(10).text('Subtotal:', totalsX, currentY, { width: 100, align: 'right' });
    doc.text(`RM ${order.subtotal.toFixed(2)}`, totalsX + 100, currentY, { width: 100 });
    currentY += 15;

    if (order.discount > 0) {
      doc.text('Discount:', totalsX, currentY, { width: 100, align: 'right' });
      doc.text(`-RM ${order.discount.toFixed(2)}`, totalsX + 100, currentY, { width: 100 });
      currentY += 15;
    }

    if (order.shippingCost > 0) {
      doc.text('Shipping:', totalsX, currentY, { width: 100, align: 'right' });
      doc.text(`RM ${order.shippingCost.toFixed(2)}`, totalsX + 100, currentY, { width: 100 });
      currentY += 15;
    }

    if (order.tax > 0) {
      doc.text('Tax:', totalsX, currentY, { width: 100, align: 'right' });
      doc.text(`RM ${order.tax.toFixed(2)}`, totalsX + 100, currentY, { width: 100 });
      currentY += 15;
    }

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', totalsX, currentY, { width: 100, align: 'right' });
    doc.text(`RM ${order.total.toFixed(2)}`, totalsX + 100, currentY, { width: 100 });

    currentY += 30;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, currentY);
    doc.text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 50, currentY + 15);
    if (order.notes) {
      doc.text(`Notes: ${order.notes}`, 50, currentY + 30);
    }

    currentY += 60;
    doc.fontSize(8).text('Thank you for your business!', { align: 'center' });
    doc.text('www.hipercom.com.my', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

export default router;
