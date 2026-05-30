import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Default transporter from .env (fallback)
let transporter = null;
let transporterConfig = null;

function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host || 'smtp.gmail.com',
    port: parseInt(config.port || '587'),
    secure: config.secure === 'true',
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function configsEqual(a, b) {
  if (!a || !b) return false;
  return a.host === b.host && a.port === b.port &&
    a.secure === b.secure && a.user === b.user && a.pass === b.pass;
}

async function getDbSmtpConfig() {
  try {
    const { default: prisma } = await import('../db/prisma.js');
    const keys = ['email_host', 'email_port', 'email_secure', 'email_user', 'email_pass', 'email_from'];
    const settings = await prisma.settings.findMany({
      where: { key: { in: keys } }
    });
    if (settings.length === 0) return null;
    const config = {};
    settings.forEach(s => {
      const key = s.key.replace('email_', '');
      config[key] = s.value;
    });
    return config;
  } catch {
    return null;
  }
}

async function getActiveTransporter() {
  const dbConfig = await getDbSmtpConfig();

  if (dbConfig && dbConfig.user && dbConfig.pass) {
    const normalized = { host: dbConfig.host, port: dbConfig.port, secure: dbConfig.secure, user: dbConfig.user, pass: dbConfig.pass };
    if (!transporter || !configsEqual(transporterConfig, normalized)) {
      transporter = createTransporter(normalized);
      transporterConfig = normalized;
    }
    return transporter;
  }

  // Fallback to .env
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const envConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || '587',
      secure: process.env.EMAIL_SECURE || 'false',
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };
    if (!transporter || !configsEqual(transporterConfig, envConfig)) {
      transporter = createTransporter(envConfig);
      transporterConfig = envConfig;
    }
    return transporter;
  }

  return null;
}

// Email templates
const templates = {
  orderConfirmation: (order, user) => ({
    subject: `Order Confirmed #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Thank you for your order!</h2>
        <p>Hi ${user?.username || user?.email || 'there'},</p>
        <p>Your order has been confirmed. Here are the details:</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order #${order.orderNumber}</h3>
          <p><strong>Total:</strong> RM ${order.total.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Delivery:</strong> ${order.deliveryType === 'shipping' ? 'Shipping to address' : 'Pickup at branch'}</p>
        </div>

        <h3>Items:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${order.items?.map(item => `
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 0;">${item.product?.name || 'Product'}</td>
              <td style="padding: 10px 0; text-align: right;">x${item.quantity}</td>
              <td style="padding: 10px 0; text-align: right;">RM ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        <p style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}/orders" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Order
          </a>
        </p>
      </div>
    `,
  }),

  welcome: (data) => ({
    subject: 'Welcome to HiperCom!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to HiperCom!</h2>
        <p>Hi ${data.username || data.email || 'there'},</p>
        <p>Thank you for joining HiperCom! We're excited to have you as a customer.</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Get Started</h3>
          <ul style="padding-left: 20px;">
            <li>Browse our <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}/products">latest products</a></li>
            <li>Check out our featured items</li>
            <li>Refer friends and earn rewards!</li>
          </ul>
        </div>

        <p style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Start Shopping
          </a>
        </p>
      </div>
    `,
  }),

  orderStatusUpdate: (order, user) => ({
    subject: `Order Update #${order.orderNumber} - ${order.status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Order Status Updated</h2>
        <p>Hi ${user.username},</p>
        <p>Your order status has been updated:</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order #${order.orderNumber}</h3>
          <p><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${order.status.toUpperCase()}</span></p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        </div>

        <p style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}/orders" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Order
          </a>
        </p>
      </div>
    `,
  }),

  welcome: (user) => ({
    subject: 'Welcome to HiperCom!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to HiperCom!</h2>
        <p>Hi ${user.username || user.email || 'there'},</p>
        <p>Thank you for joining HiperCom! We're excited to have you as a customer.</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Get Started</h3>
          <ul style="padding-left: 20px;">
            <li>Browse our <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}/products">latest products</a></li>
            <li>Check out our featured items</li>
            <li>Refer friends and earn rewards!</li>
          </ul>
        </div>

        <p style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Start Shopping
          </a>
        </p>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset</h2>
        <p>Hi ${data.user?.username || data.user?.email},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        
        <p style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}/reset-password?token=${data.resetToken}" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>

        <p style="color: #6B7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),
};

// Send email function
export async function sendEmail({ to, template, data }) {
  try {
    const activeTransporter = await getActiveTransporter();

    if (!activeTransporter) {
      console.log('⚠️ Email not configured (no DB or .env SMTP config), skipping send');
      return { success: false, reason: 'not_configured' };
    }

    const templateFn = templates[template];
    if (!templateFn) {
      throw new Error(`Email template '${template}' not found`);
    }

    const { subject, html } = templateFn(data);

    // Get from address - check DB first, then .env
    const dbConfig = await getDbSmtpConfig();
    const from = dbConfig?.from || process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const mailOptions = {
      from,
      to,
      subject,
      html,
    };

    const result = await activeTransporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

// Export specific email functions
export async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email || user.to,
    template: 'welcome',
    data: user,
  });
}

export async function sendOrderConfirmation(order, user) {
  return sendEmail({
    to: user.email,
    template: 'orderConfirmation',
    data: { order, user },
  });
}

export async function sendOrderStatusUpdate(order, user) {
  return sendEmail({
    to: user.email,
    template: 'orderStatusUpdate',
    data: { order, user },
  });
}

export async function sendPasswordResetEmail(user, resetToken) {
  try {
    return sendEmail({
      to: user.email,
      template: 'passwordReset',
      data: { 
        user: { 
          username: user.username || user.email, 
          email: user.email 
        },
        resetToken 
      },
    });
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
}

// Expose for test endpoint
export async function sendTestEmail(to) {
  const result = await sendEmail({
    to,
    template: 'welcome',
    data: { username: 'Test User', email: to },
  });
  return result;
}

export default {
  sendEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTestEmail,
};
