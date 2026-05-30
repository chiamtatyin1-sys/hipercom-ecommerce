import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
} from '../services/notifications.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true',
    });

    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const result = await getUnreadCount(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/read-all', authenticate, async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await deleteNotification(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
