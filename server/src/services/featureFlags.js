import prisma from '../db/prisma.js';

const DEFAULT_FEATURES = {
  enableReviews: true,
  enableWishlist: true,
  enableCoupons: true,
  enableReferrals: true,
  enableLoyaltyPoints: false,
  enableProductComparison: false,
  enablePriceAlerts: false,
  enableGiftCards: false,
  enableSubscriptions: false,
  enableAdvancedAnalytics: false,
  enableAIRecommendations: false,
  enableChatBot: true,
  enableNotifications: true,
  enableMultiWarehouse: false,
  enableStockTransfer: false,
  enableBulkOperations: false,
  enableAPIAccess: false,
  enableCustomBranding: false,
  enableAdvancedSEO: false,
  enableEmailMarketing: false,
};

export async function getFeatureFlags(sellerId) {
  try {
    const flags = await prisma.featureFlag.findMany({
      where: { sellerId },
    });

    const flagMap = {};
    flags.forEach(flag => {
      flagMap[flag.feature] = {
        isEnabled: flag.isEnabled,
        config: JSON.parse(flag.config),
      };
    });

    const result = {};
    for (const [feature, defaultValue] of Object.entries(DEFAULT_FEATURES)) {
      if (flagMap[feature]) {
        result[feature] = flagMap[feature];
      } else {
        result[feature] = {
          isEnabled: defaultValue,
          config: {},
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return Object.fromEntries(
      Object.entries(DEFAULT_FEATURES).map(([feature, isEnabled]) => [
        feature,
        { isEnabled, config: {} },
      ])
    );
  }
}

export async function updateFeatureFlag(sellerId, feature, isEnabled, config = {}) {
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true },
    });

    if (!userExists && sellerId !== 'admin') {
      throw new Error('User not found');
    }

    const flag = await prisma.featureFlag.upsert({
      where: {
        sellerId_feature: { sellerId, feature },
      },
      update: {
        isEnabled,
        config: JSON.stringify(config),
      },
      create: {
        sellerId,
        feature,
        isEnabled,
        config: JSON.stringify(config),
      },
    });

    return flag;
  } catch (error) {
    console.error('Error updating feature flag:', error);
    throw error;
  }
}

export async function isFeatureEnabled(sellerId, feature) {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: {
        sellerId_feature: { sellerId, feature },
      },
    });

    if (!flag) {
      return DEFAULT_FEATURES[feature] ?? false;
    }

    return flag.isEnabled;
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return DEFAULT_FEATURES[feature] ?? false;
  }
}

export async function resetFeatureFlags(sellerId) {
  try {
    await prisma.featureFlag.deleteMany({
      where: { sellerId },
    });

    return { message: 'Feature flags reset to defaults' };
  } catch (error) {
    console.error('Error resetting feature flags:', error);
    throw error;
  }
}

export function featureGuard(feature) {
  return async (req, res, next) => {
    try {
      const sellerId = req.user.role === 'admin' ? 'admin' : req.user.id;
      const enabled = await isFeatureEnabled(sellerId, feature);

      if (!enabled) {
        return res.status(403).json({
          error: 'Feature disabled',
          feature,
          message: `The ${feature} feature is currently disabled. Contact your administrator to enable it.`,
        });
      }

      next();
    } catch (error) {
      console.error('Feature guard error:', error);
      next();
    }
  };
}

export { DEFAULT_FEATURES };
