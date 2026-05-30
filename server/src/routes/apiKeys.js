import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createApiKey,
  getUserApiKeys,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  AVAILABLE_PERMISSIONS,
} from '../services/apiKeys.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const keys = await getUserApiKeys(req.user.id);

    res.json({
      keys: keys.map(k => ({
        ...k,
        key: k.key.substring(0, 12) + '...',
      })),
      permissions: AVAILABLE_PERMISSIONS,
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, permissions, expiresAt } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Key name is required' });
    }

    const apiKey = await createApiKey(req.user.id, name, permissions || [], expiresAt);

    res.status(201).json({
      message: 'API key created',
      key: apiKey.key,
      warning: 'Store this key securely. It will not be shown again.',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, permissions, isActive, expiresAt } = req.body;

    const apiKey = await updateApiKey(req.params.id, req.user.id, {
      name,
      permissions,
      isActive,
      expiresAt,
    });

    res.json({
      message: 'API key updated',
      key: apiKey,
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await deleteApiKey(req.params.id, req.user.id);
    res.json({ message: 'API key deleted' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

router.post('/:id/revoke', authenticate, async (req, res) => {
  try {
    await revokeApiKey(req.params.id, req.user.id);
    res.json({ message: 'API key revoked' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export default router;
