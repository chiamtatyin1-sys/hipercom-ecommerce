import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Mail, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminStockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchAlerts(); fetchUnreadCount(); }, [page, filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filter) params.isRead = filter;
      const res = await api.get('/stock-alerts', { params });
      setAlerts(res.data.alerts);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/stock-alerts/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/stock-alerts/mark-read/${id}`);
      fetchAlerts();
      fetchUnreadCount();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/stock-alerts/mark-all-read');
      toast.success('All alerts marked as read');
      fetchAlerts();
      fetchUnreadCount();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  if (loading && !alerts.length) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading stock alerts...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-orange-500" /> Stock Alerts</h2>
          {unreadCount > 0 && <span className="badge bg-red-100 text-red-700">{unreadCount} unread</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Mark All Read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold">{pagination.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Unread</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Email Notifications</p>
              <p className="text-sm font-medium text-green-600">Enabled</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex gap-2">
          <button onClick={() => { setFilter(''); setPage(1); }} className={`btn ${!filter ? 'btn-primary' : 'btn-secondary'}`}>All</button>
          <button onClick={() => { setFilter('false'); setPage(1); }} className={`btn ${filter === 'false' ? 'btn-primary' : 'btn-secondary'}`}>Unread</button>
          <button onClick={() => { setFilter('true'); setPage(1); }} className={`btn ${filter === 'true' ? 'btn-primary' : 'btn-secondary'}`}>Read</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No stock alerts</p>
        ) : (
          <div className="divide-y">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-4 flex items-center justify-between ${!alert.isRead ? 'bg-orange-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${!alert.isRead ? 'text-orange-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {!alert.isRead && (
                  <button onClick={() => markAsRead(alert.id)} className="btn btn-secondary px-3 py-1 text-sm">Mark Read</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary">Previous</button>
          <span className="px-4 py-2">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn btn-secondary">Next</button>
        </div>
      )}
    </div>
  );
}
