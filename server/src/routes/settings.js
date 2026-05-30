import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await prisma.settings.findMany();
    const settingsMap = {};
    const secretKeys = ['ai_apiKey', 'email_pass', 'hitpay_api_key', 'hitpay_salt', 'jwt_secret'];
    settings.forEach(s => {
      if (!secretKeys.includes(s.key)) {
        settingsMap[s.key] = s.value;
      }
    });

    const taxConfig = await prisma.taxConfig.findFirst({ where: { isActive: true } });

    res.json({
      ...settingsMap,
      tax: taxConfig,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { key, value } = req.body;

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

router.put('/tax', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, rate, isActive } = req.body;

    const existing = await prisma.taxConfig.findFirst();
    let taxConfig;

    if (existing) {
      taxConfig = await prisma.taxConfig.update({
        where: { id: existing.id },
        data: { name, rate, isActive },
      });
    } else {
      taxConfig = await prisma.taxConfig.create({
        data: { name, rate, isActive },
      });
    }

    res.json(taxConfig);
  } catch (error) {
    console.error('Update tax config error:', error);
    res.status(500).json({ error: 'Failed to update tax config' });
  }
});

router.get('/currencies', async (req, res) => {
  try {
    const currencies = [
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', default: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', default: false },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', default: false },
      { code: 'EUR', name: 'Euro', symbol: '€', default: false },
      { code: 'GBP', name: 'British Pound', symbol: '£', default: false },
    ];

    const enabledCurrencies = await prisma.settings.findUnique({
      where: { key: 'enabled_currencies' },
    });

    const enabled = enabledCurrencies?.value ? JSON.parse(enabledCurrencies.value) : ['MYR'];

    res.json({
      currencies,
      enabled,
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ error: 'Failed to get currencies' });
  }
});

router.put('/currencies', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { enabled } = req.body;

    await prisma.settings.upsert({
      where: { key: 'enabled_currencies' },
      update: { value: JSON.stringify(enabled) },
      create: { key: 'enabled_currencies', value: JSON.stringify(enabled) },
    });

    res.json({ message: 'Currencies updated', enabled });
  } catch (error) {
    console.error('Update currencies error:', error);
    res.status(500).json({ error: 'Failed to update currencies' });
  }
});

// AI Settings
router.get('/ai', async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      where: { key: { startsWith: 'ai_' } },
    });

    const aiConfig = {
      provider: 'default',
      apiKey: '',
      lmStudioUrl: 'http://localhost:1234',
      llmStudioUrl: 'http://localhost:1234',
      ollamaUrl: 'http://localhost:11434',
      enabled: true,
    };

    settings.forEach(s => {
      if (s.key === 'ai_provider') aiConfig.provider = s.value;
      if (s.key === 'ai_apiKey') aiConfig.apiKey = s.value; // Don't send actual key
      if (s.key === 'ai_llmStudioUrl') aiConfig.llmStudioUrl = s.value;
      if (s.key === 'ai_ollamaUrl') aiConfig.ollamaUrl = s.value;
      if (s.key === 'ai_enabled') aiConfig.enabled = s.value === 'true';
    });

    res.json(aiConfig);
  } catch (error) {
    console.error('Get AI settings error:', error);
    res.status(500).json({ error: 'Failed to get AI settings' });
  }
});

router.put('/ai', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { provider, apiKey, llmStudioUrl, ollamaUrl, enabled, aiName, aiSystemPrompt, customInstructions } = req.body;

    const updates = [
      { key: 'ai_provider', value: provider },
      { key: 'ai_enabled', value: String(enabled) },
    ];

    if (apiKey) updates.push({ key: 'ai_apiKey', value: apiKey });
    if (llmStudioUrl) updates.push({ key: 'ai_llmStudioUrl', value: llmStudioUrl });
    if (ollamaUrl) updates.push({ key: 'ai_ollamaUrl', value: ollamaUrl });
    if (aiName) updates.push({ key: 'ai_name', value: aiName });
    if (aiSystemPrompt !== undefined) updates.push({ key: 'ai_systemPrompt', value: aiSystemPrompt });
    if (customInstructions !== undefined) updates.push({ key: 'ai_customInstructions', value: JSON.stringify(customInstructions) });

    await Promise.all(
      updates.map(u =>
        prisma.settings.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    );

    // Reload system prompt if changed
    if (aiSystemPrompt !== undefined || customInstructions !== undefined) {
      const { loadSystemPrompt } = await import('../services/ai.js');
      await loadSystemPrompt();
    }

    res.json({ message: 'AI settings updated', provider, enabled });
  } catch (error) {
    console.error('Update AI settings error:', error);
    res.status(500).json({ error: 'Failed to update AI settings' });
  }
});

// Email Settings - batch save
router.put('/email', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { host, port, secure, user, pass, from } = req.body;
    const updates = [];
    if (host !== undefined) updates.push({ key: 'email_host', value: host });
    if (port !== undefined) updates.push({ key: 'email_port', value: String(port) });
    if (secure !== undefined) updates.push({ key: 'email_secure', value: String(secure) });
    if (user !== undefined) updates.push({ key: 'email_user', value: user });
    if (pass !== undefined) updates.push({ key: 'email_pass', value: pass });
    if (from !== undefined) updates.push({ key: 'email_from', value: from });

    await Promise.all(
      updates.map(u =>
        prisma.settings.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    );

    res.json({ message: 'Email settings saved' });
  } catch (error) {
    console.error('Save email settings error:', error);
    res.status(500).json({ error: 'Failed to save email settings' });
  }
});

// Email Test
router.post('/email/test', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'Valid recipient email required' });
    }

    const { sendTestEmail } = await import('../services/email.js');
    const result = await sendTestEmail(to);
    res.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/ai/providers', async (req, res) => {
  try {
    const { PROVIDERS } = await import('../services/ai.js');
    const providers = Object.entries(PROVIDERS).map(([key, value]) => ({
      id: key,
      name: value.name,
      needsApiKey: value.needsApiKey,
      isLocal: !value.needsApiKey || ['lmstudio', 'llmstudio', 'ollama', 'gemma'].includes(key),
    }));
    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

export default router;