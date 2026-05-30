import prisma from '../db/prisma.js';

export async function createNotification(userId, title, message, type = 'info', link = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
}

export async function getUserNotifications(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function markNotificationRead(notificationId, userId) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    return notification;
  } catch (error) {
    console.error('Mark notification read error:', error);
    throw error;
  }
}

export async function markAllNotificationsRead(userId) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    throw error;
  }
}

export async function deleteNotification(notificationId, userId) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId, userId },
    });

    return { message: 'Notification deleted' };
  } catch (error) {
    console.error('Delete notification error:', error);
    throw error;
  }
}

export async function getUnreadCount(userId) {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  } catch (error) {
    console.error('Get unread count error:', error);
    return { count: 0 };
  }
}

export async function deleteOldNotifications(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deleted: result.count };
  } catch (error) {
    console.error('Delete old notifications error:', error);
    throw error;
  }
}
