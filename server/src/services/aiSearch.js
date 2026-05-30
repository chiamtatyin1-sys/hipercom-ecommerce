import prisma from '../db/prisma.js';

const CATEGORY_KEYWORDS = {
  laptop: ['laptop', 'notebook', 'computer', 'pc'],
  digital: ['digital', 'software', 'license', 'subscription', 'download'],
  accessory: ['accessory', 'mouse', 'keyboard', 'headphone', 'charger', 'cable'],
  monitor: ['monitor', 'display', 'screen'],
  storage: ['storage', 'ssd', 'hdd', 'usb', 'flash drive', 'memory'],
};

const PRICE_PATTERNS = [
  /under\s*(\d+)/i,
  /below\s*(\d+)/i,
  /less\s*than\s*(\d+)/i,
  /cheap/i,
  /affordable/i,
  /budget/i,
  /above\s*(\d+)/i,
  /over\s*(\d+)/i,
  /more\s*than\s*(\d+)/i,
  /expensive/i,
  /premium/i,
  /between\s*(\d+)\s*and\s*(\d+)/i,
  /from\s*(\d+)\s*to\s*(\d+)/i,
];

const FEATURE_KEYWORDS = {
  gaming: ['gaming', 'game', 'gpu', 'graphics', 'nvidia', 'amd', 'rtx', 'gtx'],
  business: ['business', 'office', 'work', 'professional', 'enterprise'],
  student: ['student', 'school', 'education', 'learning', 'study'],
  portable: ['portable', 'lightweight', 'thin', 'compact', 'travel'],
  powerful: ['powerful', 'fast', 'performance', 'high-end', 'flagship'],
};

export async function aiSearch(query, options = {}) {
  const { limit = 20, page = 1, userId } = options;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const searchIntent = await extractSearchIntent(query);

  const where = { isActive: true };

  if (searchIntent.category) {
    where.category = {
      slug: { contains: searchIntent.category },
    };
  }

  if (searchIntent.priceRange) {
    if (searchIntent.priceRange.max) {
      where.price = { lte: searchIntent.priceRange.max };
    }
    if (searchIntent.priceRange.min) {
      where.price = { ...where.price, gte: searchIntent.priceRange.min };
    }
  }

  if (searchIntent.features?.length > 0) {
    where.OR = searchIntent.features.map(feature => ({
      OR: [
        { name: { contains: feature } },
        { description: { contains: feature } },
      ],
    }));
  }

  if (searchIntent.keyword) {
    where.OR = [
      ...(where.OR || []),
      { name: { contains: searchIntent.keyword } },
      { description: { contains: searchIntent.keyword } },
      { sku: { contains: searchIntent.keyword } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const formattedProducts = products.map(product => {
    let parsedImages = [];
    try {
      parsedImages = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []);
    } catch {
      parsedImages = product.images?.startsWith?.('http') ? [product.images] : [];
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      images: parsedImages,
      stock: product.stock,
      brand: product.brand,
      category: product.category,
      isFeatured: product.isFeatured,
    };
  });

  return {
    products: formattedProducts,
    intent: searchIntent,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

async function extractSearchIntent(query) {
  const intent = {
    category: null,
    priceRange: { min: null, max: null },
    features: [],
    keyword: null,
    rawQuery: query,
  };

  const lowerQuery = query.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      intent.category = category;
      break;
    }
  }

  for (const pattern of PRICE_PATTERNS) {
    const match = lowerQuery.match(pattern);
    if (match) {
      if (pattern.source.includes('between') || pattern.source.includes('from')) {
        intent.priceRange.min = parseInt(match[1]);
        intent.priceRange.max = parseInt(match[2]);
      } else if (
        pattern.source.includes('under') ||
        pattern.source.includes('below') ||
        pattern.source.includes('less') ||
        pattern.source.includes('cheap') ||
        pattern.source.includes('affordable') ||
        pattern.source.includes('budget')
      ) {
        const amount = parseInt(match[1]) || 1000;
        intent.priceRange.max = amount;
      } else {
        const amount = parseInt(match[1]) || 2000;
        intent.priceRange.min = amount;
      }
      break;
    }
  }

  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      if (!intent.features.includes(feature)) {
        intent.features.push(feature);
      }
    }
  }

  const stopWords = [
    'i', 'want', 'need', 'looking', 'for', 'a', 'an', 'the', 'my', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'to',
    'of', 'in', 'on', 'at', 'by', 'with', 'from', 'and', 'or', 'but', 'not',
    'this', 'that', 'these', 'those', 'it', 'its',
  ];

  const words = lowerQuery.split(/\s+/).filter(word =>
    word.length > 2 && !stopWords.includes(word)
  );

  if (words.length > 0) {
    intent.keyword = words.join(' ');
  }

  return intent;
}

export async function aiSearchWithLLM(query, options = {}) {
  try {
    const aiEnabledSetting = await prisma.settings.findUnique({ where: { key: 'ai_enabled' } });
    const aiEnabled = aiEnabledSetting?.value === 'true';

    if (!aiEnabled) {
      return aiSearch(query, options);
    }

    const systemPrompt = `You are a search intent extractor for an e-commerce store.
Extract the following from the user's search query:
- category: One of [laptop, digital, accessory, monitor, storage] or null
- priceRange: { min: number | null, max: number | null }
- features: Array of [gaming, business, student, portable, powerful] or empty
- keyword: The main search term (product name or brand)

Return ONLY a JSON object with these fields. No explanation.`;

    const userPrompt = `Search query: "${query}"`;

    let llmResponse;
    try {
      const aiService = await import('../services/ai.js');
      llmResponse = await aiService.default.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    } catch (error) {
      console.error('LLM search failed, falling back to rule-based:', error.message);
      return aiSearch(query, options);
    }

    let extractedIntent;
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedIntent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', error.message);
      return aiSearch(query, options);
    }

    const { limit = 20, page = 1 } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };

    if (extractedIntent.category) {
      where.category = {
        slug: { contains: extractedIntent.category },
      };
    }

    if (extractedIntent.priceRange) {
      if (extractedIntent.priceRange.max) {
        where.price = { lte: extractedIntent.priceRange.max };
      }
      if (extractedIntent.priceRange.min) {
        where.price = { ...where.price, gte: extractedIntent.priceRange.min };
      }
    }

    if (extractedIntent.features?.length > 0) {
      where.OR = extractedIntent.features.map(feature => ({
        OR: [
          { name: { contains: feature } },
          { description: { contains: feature } },
        ],
      }));
    }

    if (extractedIntent.keyword) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: extractedIntent.keyword } },
        { description: { contains: extractedIntent.keyword } },
        { sku: { contains: extractedIntent.keyword } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map(product => {
      let parsedImages = [];
      try {
        parsedImages = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []);
      } catch {
        parsedImages = product.images?.startsWith?.('http') ? [product.images] : [];
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        images: parsedImages,
        stock: product.stock,
        brand: product.brand,
        category: product.category,
        isFeatured: product.isFeatured,
      };
    });

    return {
      products: formattedProducts,
      intent: {
        ...extractedIntent,
        rawQuery: query,
        usedAI: true,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    console.error('AI search error:', error);
    return aiSearch(query, options);
  }
}
