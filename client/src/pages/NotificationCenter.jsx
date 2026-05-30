import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Bell, Check, Trash2, ChevronLeft, ChevronRight, Package, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_ICONS = {
  order: Package,
  payment: CreditCard,
  alert: AlertTriangle,
  info: Info,
  success: Check,
};

const TYPE_COLORS = {
  order: 'bg-blue-100 text-blue-700',
  payment: 'bg-green-100 text-green-700',
  alert: 'bg-red-100 text-red-700',
  info: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page, showUnreadOnly]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (showUnreadOnly) params.unreadOnly = 'true';

      const res = await api.get('/notifications', { params });
      setNotifications(res.data.notifications);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => { setShowUnreadOnly(e.target.checked); setPage(1); }}
              className="h-4 w-4 text-primary-600"
            />
            Unread only
          </label>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn btn-secondary text-sm">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No notifications</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map(notif => {
              const Icon = TYPE_ICONS[notif.type] || Info;
              const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.info;

              return (
                <div
                  key={notif.id}
                  className={`card p-4 transition-colors ${
                    !notif.isRead ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{notif.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(notif.createdAt)}
                          </span>
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-primary-600 hover:text-primary-800"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {notif.link && (
                        <Link
                          to={notif.link}
                          className="text-sm text-primary-600 hover:text-primary-800 mt-2 inline-block"
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
