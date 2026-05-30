import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle, Package, CreditCard } from 'lucide-react';
import api from '../services/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes, alertsRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 5 } }),
        api.get('/notifications/unread-count'),
        api.get('/stock-alerts', { params: { limit: 3 } }),
      ]);

      const systemNotifs = (notifRes.data.notifications || []).map(n => ({
        id: `n-${n.id}`,
        type: n.type,
        title: n.title,
        message: n.message,
        time: n.createdAt,
        read: n.isRead,
        link: n.link,
      }));

      const stockAlerts = (alertsRes.data.alerts || []).map(a => ({
        id: `a-${a.id}`,
        type: 'warning',
        title: 'Stock Alert',
        message: a.message,
        time: a.createdAt,
        read: a.isRead,
        link: '/admin/stock-alerts',
      }));

      setNotifications([...systemNotifs, ...stockAlerts]);
      setUnreadCount(countRes.data.count || 0);
    } catch (error) {
      // ignore
    }
  };

  const markAsRead = async (id) => {
    try {
      if (id.startsWith('n-')) {
        await api.post(`/notifications/${id.replace('n-', '')}/read`);
      } else {
        await api.post(`/stock-alerts/mark-read/${id.replace('a-', '')}`);
      }
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all([
        api.post('/notifications/read-all'),
        api.post('/stock-alerts/mark-all-read'),
      ]);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      // ignore
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4 text-blue-500" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-600"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 border">
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:text-primary-700">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-primary-50' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    {getIcon(notif.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(notif.time).toLocaleString()}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t px-4 py-2">
            <Link to="/notifications" className="text-xs text-primary-600 hover:text-primary-700">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
