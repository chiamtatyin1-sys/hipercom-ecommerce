import crypto from 'crypto';
import prisma from '../db/prisma.js';

const AVAILABLE_PERMISSIONS = [
  'read:products',
  'write:products',
  'read:orders',
  'write:orders',
  'read:customers',
  'read:analytics',
  'read:inventory',
  'write:inventory',
];

export function generateApiKey() {
  return `sk_live_${crypto.randomBytes(32).toString('hex')}`;
}

export async function createApiKey(userId, name, permissions = [], expiresAt = null) {
  try {
    const key = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        key,
        name,
        permissions: JSON.stringify(permissions),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return {
      ...apiKey,
      key,
    };
  } catch (error) {
    console.error('Create API key error:', error);
    throw error;
  }
}

export async function getUserApiKeys(userId) {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map(key => ({
      ...key,
      permissions: JSON.parse(key.permissions),
    }));
  } catch (error) {
    console.error('Get API keys error:', error);
    throw error;
  }
}

export async function getApiKeyByKey(key) {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: true },
    });

    if (!apiKey) return null;

    if (!apiKey.isActive) return null;

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { isActive: false },
      });
      return null;
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      ...apiKey,
      permissions: JSON.parse(apiKey.permissions),
    };
  } catch (error) {
    console.error('Get API key error:', error);
    return null;
  }
}

export async function updateApiKey(keyId, userId, updates) {
  try {
    const apiKey = await prisma.apiKey.update({
      where: { id: keyId, userId },
      data: {
        name: updates.name,
        permissions: updates.permissions ? JSON.stringify(updates.permissions) : undefined,
        isActive: updates.isActive,
        expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : undefined,
      },
    });

    return {
      ...apiKey,
      permissions: JSON.parse(apiKey.permissions),
    };
  } catch (error) {
    console.error('Update API key error:', error);
    throw error;
  }
}

export async function deleteApiKey(keyId, userId) {
  try {
    await prisma.apiKey.delete({
      where: { id: keyId, userId },
    });

    return { message: 'API key deleted' };
  } catch (error) {
    console.error('Delete API key error:', error);
    throw error;
  }
}

export async function revokeApiKey(keyId, userId) {
  try {
    await prisma.apiKey.update({
      where: { id: keyId, userId },
      data: { isActive: false },
    });

    return { message: 'API key revoked' };
  } catch (error) {
    console.error('Revoke API key error:', error);
    throw error;
  }
}

export function apiKeyAuth(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'API key required' });
      }

      const key = authHeader.split(' ')[1];
      const apiKey = await getApiKeyByKey(key);

      if (!apiKey) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
      }

      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(p =>
          apiKey.permissions.includes(p)
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: requiredPermissions,
          });
        }
      }

      req.apiKey = apiKey;
      req.user = apiKey.user;

      next();
    } catch (error) {
      console.error('API key auth error:', error);
      res.status(500).json({ error: 'Authentication error' });
    }
  };
}

export { AVAILABLE_PERMISSIONS };
