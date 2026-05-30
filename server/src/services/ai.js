// AI Service - Multiple LLM Provider Support

import prisma from '../db/prisma.js';

let SYSTEM_PROMPT = '';

// Load system prompt from settings
export async function loadSystemPrompt() {
  try {
    const setting = await prisma.settings.findUnique({ where: { key: 'ai_systemPrompt' } });
    const nameSetting = await prisma.settings.findUnique({ where: { key: 'ai_name' } });
    const instructionsSetting = await prisma.settings.findUnique({ where: { key: 'ai_customInstructions' } });
    const name = nameSetting?.value || 'JARVIS';

    let basePrompt = setting?.value || `You are ${name}, HiperCom's virtual shopping assistant. You help customers with:
- Product information (availability, prices, features)
- Order status and tracking
- Shipping and delivery options
- Payment methods and policies
- Returns and refunds

Keep responses concise, professional, and helpful. Do NOT reveal you are an AI model or mention Google, OpenAI, or any AI company. Always identify as "${name} - HiperCom Assistant".

You have access to live product inventory. Use this information to help customers make informed decisions.`;

    // Append enabled custom instructions
    let customInstructions = [];
    try {
      customInstructions = instructionsSetting?.value ? JSON.parse(instructionsSetting.value) : [];
    } catch {
      customInstructions = [];
    }

    const enabledInstructions = customInstructions.filter(i => i.enabled);
    if (enabledInstructions.length > 0) {
      basePrompt += '\n\nAdditional Instructions:\n' + enabledInstructions.map(i => `- ${i.text}`).join('\n');
    }

    SYSTEM_PROMPT = basePrompt;
    return SYSTEM_PROMPT;
  } catch (error) {
    console.error('Failed to load system prompt:', error.message);
    return '';
  }
}

// Initialize on load
loadSystemPrompt();

const PROVIDERS = {
  // OpenRouter - FREE Models Only
  openrouter: {
    name: 'OpenRouter (Free)',
    needsApiKey: true,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemma-3-4b-it:free',
    formatBody: (messages, apiKey) => ({
      model: 'google/gemma-3-4b-it:free',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
      temperature: 0.7,
    }),
  },

  // OpenAI
  openai: {
    name: 'OpenAI (GPT-4)',
    needsApiKey: true,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    formatBody: (messages, apiKey) => ({
      model: 'gpt-4',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
      temperature: 0.7,
    }),
  },

  // Anthropic (Claude)
  anthropic: {
    name: 'Anthropic (Claude)',
    needsApiKey: true,
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    formatBody: (messages, apiKey) => ({
      model: 'claude-3-haiku-20240307',
      system: SYSTEM_PROMPT,
      max_tokens: 1024,
      messages: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message })),
    }),
    headers: (apiKey) => ({ 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }),
  },

  // Google Gemini
  gemini: {
    name: 'Google Gemini',
    needsApiKey: true,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    formatBody: (messages, apiKey) => ({
      contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + messages.map(m => m.message).join('\n') }] }],
    }),
  },

  // Google Gemma (Local)
  gemma: {
    name: 'Google Gemma (Local)',
    needsApiKey: false,
    endpoint: 'http://localhost:1234/v1/chat/completions',
    model: 'gemma-4-e4b',
    formatBody: (messages) => ({
      model: 'gemma-4-e4b',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
      temperature: 0.7,
    }),
  },

  // Qwen (Alibaba)
  qwen: {
    name: 'Qwen (Alibaba)',
    needsApiKey: true,
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-turbo',
    formatBody: (messages, apiKey) => ({
      model: 'qwen-turbo',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
    }),
  },

  // DeepSeek
  deepseek: {
    name: 'DeepSeek',
    needsApiKey: true,
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    formatBody: (messages, apiKey) => ({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
    }),
  },

  // Kimi (Moonshot)
  kimi: {
    name: 'Kimi (Moonshot)',
    needsApiKey: true,
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    formatBody: (messages, apiKey) => ({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
    }),
  },

  // Grok (xAI)
  grok: {
    name: 'Grok (xAI)',
    needsApiKey: true,
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-beta',
    formatBody: (messages, apiKey) => ({
      model: 'grok-beta',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
    }),
  },

  // LM Studio (Local)
  lmstudio: {
    name: 'LM Studio (Local)',
    needsApiKey: false,
    endpoint: 'http://localhost:1234/v1/chat/completions',
    model: '',
    formatBody: (messages) => ({
      model: 'auto',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  },

  // LLM Studio (Local) - alias for LM Studio
  llmstudio: {
    name: 'LM Studio (Local)',
    needsApiKey: false,
    endpoint: 'http://localhost:1234/v1/chat/completions',
    model: '',
    formatBody: (messages) => ({
      model: 'auto',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  },

  // Ollama (Local)
  ollama: {
    name: 'Ollama (Local)',
    needsApiKey: false,
    endpoint: 'http://localhost:11434/api/chat',
    model: 'llama2',
    formatBody: (messages) => ({
      model: 'llama2',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
      stream: false,
    }),
  },

  // ChatGPT (OpenAI alias)
  chatgpt: {
    name: 'ChatGPT (OpenAI)',
    needsApiKey: true,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    formatBody: (messages, apiKey) => ({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message }))],
      temperature: 0.7,
    }),
  },

  // Claude (Anthropic alias)
  claude: {
    name: 'Claude (Anthropic)',
    needsApiKey: true,
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    formatBody: (messages, apiKey) => ({
      model: 'claude-3-haiku-20240307',
      system: SYSTEM_PROMPT,
      max_tokens: 1024,
      messages: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.message })),
    }),
    headers: (apiKey) => ({ 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }),
  },

  // Default Rule-based
  default: {
    name: 'Rule-based AI',
    needsApiKey: false,
  },
};

export async function getAIResponse(messages, config = {}) {
  const { provider = 'default', apiKey, endpoint: customEndpoint } = config;

  if (provider === 'default') {
    return getRuleBasedResponse(messages);
  }

  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) {
    return getRuleBasedResponse(messages);
  }

  if (providerConfig.needsApiKey && !apiKey) {
    return getRuleBasedResponse(messages);
  }

  const endpoint = customEndpoint || providerConfig.endpoint;

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(providerConfig.headers ? providerConfig.headers(apiKey) : {}),
      ...(apiKey && !providerConfig.headers ? { 'Authorization': `Bearer ${apiKey}` } : {}),
    };

    const body = providerConfig.formatBody(messages, apiKey);

    if (provider === 'ollama') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return data.message?.content || 'AI response unavailable';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();

    // Different providers have different response formats
    if (provider === 'anthropic') {
      return data.content[0]?.text || 'AI response unavailable';
    }
    if (provider === 'gemini') {
      return data.candidates[0]?.content?.parts[0]?.text || 'AI response unavailable';
    }
    if (provider === 'llmstudio') {
      return data.choices[0]?.message?.content || 'AI response unavailable';
    }

    return data.choices[0]?.message?.content || 'AI response unavailable';
  } catch (error) {
    console.error('AI API error:', error.message);
    return getRuleBasedResponse(messages);
  }
}

// Rule-based fallback
function getRuleBasedResponse(messages) {
  const lastMessage = messages[messages.length - 1]?.message?.toLowerCase() || '';

  const faqResponses = [
    { keywords: ['shipping', 'delivery', 'deliver', 'courier'], response: 'We offer both shipping (RM5) and free pickup at our branches!' },
    { keywords: ['return', 'refund', 'money back'], response: 'You can return products within 7 days if unused and in original packaging.' },
    { keywords: ['warranty', 'guarantee'], response: 'All products come with manufacturer warranty. Check product page for details.' },
    { keywords: ['payment', 'pay', 'card', 'hitpay'], response: 'We accept payments via credit/debit cards, GrabPay, ShopeePay, and bank transfer through HitPay.' },
    { keywords: ['track', 'order status', 'where is'], response: 'You can track your order using the tracking number in your order confirmation email or in your account.' },
    { keywords: ['contact', 'phone', 'email', 'whatsapp'], response: 'Contact us at support@hipercom.com or call our hotline Mon-Sat 9am-6pm.' },
    { keywords: ['hello', 'hi', 'hey', 'greeting'], response: 'Hello! 👋 How can I help you today? I am JARVIS, your personal shopping assistant from HiperCom!' },
    { keywords: ['thank', 'thanks', 'thx'], response: 'You\'re welcome! 😊 Is there anything else I can help you with?' },
  ];

  for (const faq of faqResponses) {
    for (const keyword of faq.keywords) {
      if (lastMessage.includes(keyword)) {
        return faq.response;
      }
    }
  }

  return `I'd be happy to help! You can ask me about:\n- Products and prices\n- Shipping and delivery options\n- Payment methods\n- Order status and tracking\n- Returns and refunds\n- Warranty information\n\nWhat would you like to know?`;
}

export { PROVIDERS };
