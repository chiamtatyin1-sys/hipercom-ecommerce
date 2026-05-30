import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { getAIResponse, loadSystemPrompt } from '../services/ai.js';

const router = express.Router();

// Reload system prompt on startup
loadSystemPrompt().catch(err => console.error('Failed to load system prompt:', err.message));

// Helper: Get relevant products based on message
async function getRelevantProducts(message) {
  if (!message) return [];

  const msg = message.toLowerCase();

  // Extract potential product keywords
  const words = msg.split(' ').filter(w => w.length > 3);
  if (words.length === 0) return [];

  // Search products with seller info
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: words.join(' ') } },
        { description: { contains: words.join(' ') } },
        { category: { name: { contains: words[0] } } },
        { brand: { name: { contains: words[0] } } },
      ],
    },
    take: 5,
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      stocks: { include: { warehouse: true } },
      user: { select: { allowAIInventoryCheck: true } }, // Include seller's setting
    },
  });

  // Filter out products from sellers who disabled AI inventory check
  const filtered = products.filter(p => {
    if (!p.userId) return true; // No seller, show anyway
    return p.user?.allowAIInventoryCheck !== false;
  });

  return filtered;
}

// Format product data for AI
function formatProductsForAI(products) {
  if (!products || products.length === 0) return '';

  const lines = products.map(p => {
    const stock = p.stocks?.reduce((sum, s) => sum + s.quantity, 0) || p.stock || 0;
    return `- ${p.name} (${p.brand?.name || 'No brand'}) - RM ${p.price.toFixed(2)} - ${stock} in stock - Category: ${p.category?.name || 'Uncategorized'}`;
  });

  return `\n\nAVAILABLE PRODUCTS:\n${lines.join('\n')}\n\nUse this information to answer the user's question. Only mention products listed above.`;
}

router.post('/message', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, userInfo } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Handle user info collection (for unauthenticated users)
    let userId = req.user?.id;
    let userEmail = req.user?.email;
    let userName = req.user?.username;

    if (!req.user && userInfo) {
      // Save user info for this session
      userEmail = userInfo.email;
      userName = userInfo.name;
      // Store in session (associate with sessionId)
      if (sessionId && userInfo.email) {
        await prisma.chatSession.upsert({
          where: { sessionId },
          update: { userEmail, userName },
          create: { sessionId, userEmail, userName },
        });
      }
    }

    // Check if user is requesting human service
    const lowerMsg = message.toLowerCase();
    const humanKeywords = ['human', 'real person', 'talk to someone', 'agent', 'support team', 'whatsapp', 'contact person'];
    const wantsHuman = humanKeywords.some(kw => lowerMsg.includes(kw));

    if (wantsHuman) {
      return res.json({
        message: `I understand you'd like to speak with a human agent. You can contact our support team directly via:

📱 WhatsApp: <a href="https://wa.me/60123456789">Click here to chat with us</a>

📧 Email: support@hipercom.com
📞 Phone: +60 12-345 6789 (Mon-Sat, 9AM-6PM)

I've logged your request. A team member will assist you shortly!`,
        intent: 'human_request',
        sessionId: sessionId || 'human-' + Date.now(),
        timestamp: new Date(),
      });
    }

    const orderNumberMatch = lowerMsg.match(/(?:order|#)\s*([A-Z0-9-]+)/i);
    if (orderNumberMatch && userId) {
      const orderNum = orderNumberMatch[1];
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderNum, userId },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
      if (order) {
        const items = order.items.map(i => `• ${i.product?.name || 'Product'} x${i.quantity} - RM ${i.price.toFixed(2)}`).join('\n');
        return res.json({
          message: `📦 Order #${order.orderNumber}\n\nStatus: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\nPayment: ${order.paymentStatus}\nTotal: RM ${order.total.toFixed(2)}\n\nItems:\n${items}\n\n${order.status === 'shipped' ? 'Your order is on its way! 🚚' : order.status === 'delivered' ? 'Your order has been delivered! ✅' : 'We\'re processing your order.'}`,
          intent: 'order_status',
          sessionId: sessionId || 'order-' + Date.now(),
          timestamp: new Date(),
        });
      } else {
        return res.json({
          message: `I couldn't find order #${orderNum} in your account. Please check the order number and try again, or contact our support team for assistance.`,
          intent: 'order_status',
          sessionId: sessionId || 'order-' + Date.now(),
          timestamp: new Date(),
        });
      }
    }

    // Get AI settings
    const aiEnabled = await prisma.settings.findUnique({ where: { key: 'ai_enabled' } });
    const aiProvider = await prisma.settings.findUnique({ where: { key: 'ai_provider' } });
    const aiApiKey = await prisma.settings.findUnique({ where: { key: 'ai_apiKey' } });
    const lmStudioUrl = await prisma.settings.findUnique({ where: { key: 'ai_lmStudioUrl' } });
    const llmStudioUrl = await prisma.settings.findUnique({ where: { key: 'ai_llmStudioUrl' } });
    const ollamaUrl = await prisma.settings.findUnique({ where: { key: 'ai_ollamaUrl' } });
    const lmStudioUrlFinal = lmStudioUrl?.value || llmStudioUrl?.value;

    // Build context from conversation history
    let conversationHistory = [];

    // Add current message
    conversationHistory.push({ role: 'user', message: message || '' });

    if (sessionId) {
      const history = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
      // Format history for AI service (older messages first)
      const historyMessages = history.flatMap(h => [
        { role: 'user', message: h.message || '' },
        { role: 'ai', message: h.response || '' },
      ]);
      // Add history before current message
      conversationHistory = [...historyMessages, ...conversationHistory];
    }

    // Get AI response based on settings
    let response;
    let intent = 'general';

    if (aiEnabled?.value === 'true') {
      const provider = aiProvider?.value || 'default';
      const apiKey = aiApiKey?.value || '';

      const aiConfig = { provider, apiKey };
      if ((provider === 'lmstudio' || provider === 'llmstudio') && lmStudioUrlFinal) {
        aiConfig.endpoint = `${lmStudioUrlFinal}/v1/chat/completions`;
      }
      if (provider === 'ollama' && ollamaUrl?.value) {
        aiConfig.endpoint = `${ollamaUrl.value}/api/chat`;
      }

      const products = await getRelevantProducts(message);
      const productContext = formatProductsForAI(products);

      if (productContext) {
        conversationHistory[conversationHistory.length - 1].message += productContext;
      }

      response = await getAIResponse(conversationHistory, aiConfig);
    } else {
      // Use rule-based response
      response = await getAIResponse(conversationHistory, { provider: 'default' });
    }

    // Detect intent for logging
    if (lowerMsg.includes('order')) intent = 'order_status';
    else if (lowerMsg.includes('product') || lowerMsg.includes('price')) intent = 'product_query';
    else if (lowerMsg.includes('shipping') || lowerMsg.includes('delivery')) intent = 'shipping';
    else if (lowerMsg.includes('payment')) intent = 'payment';
    else if (lowerMsg.includes('return') || lowerMsg.includes('refund')) intent = 'refund';
    else if (wantsHuman) intent = 'human_request';

    // Save to chat history
    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId,
        sessionId: sessionId || undefined,
        message,
        response,
        intent,
        isFromAI: true,
      },
    });

    res.json({
      message: response,
      intent,
      sessionId: chatMessage.sessionId,
      timestamp: chatMessage.createdAt,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const { sessionId, limit = 50 } = req.query;

    const where = { userId: req.user.id };
    if (sessionId) where.sessionId = sessionId;

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      select: {
        sessionId: true,
        createdAt: true,
        message: true,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['sessionId'],
    });

    res.json(sessions.map(s => ({
      sessionId: s.sessionId,
      lastMessage: s.message,
      createdAt: s.createdAt,
    })));
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.get('/admin/history', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (userId) where.userId = userId;

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, email: true } },
        },
      }),
      prisma.chatMessage.count({ where }),
    ]);

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get admin chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

export default router;