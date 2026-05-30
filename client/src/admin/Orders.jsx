import { useState, useEffect } from 'react';
import { FileDown, History, X, Clock, User } from 'lucide-react';
import { ordersApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyModal, setHistoryModal] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersApi.getAll();
      setOrders(res.data.orders);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const viewHistory = async (orderId) => {
    try {
      const res = await ordersApi.getStatusHistory(orderId);
      setStatusHistory(res.data.statusHistory);
      setHistoryModal(orderId);
    } catch (error) {
      toast.error('Failed to load status history');
    }
  };

  const statusOptions = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

  const downloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to generate invoice');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading orders...</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Orders Management</h2>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Order #</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Total</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Payment</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium">History</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(o => (
              <tr key={o.id}>
                <td className="px-6 py-4 font-medium">{o.orderNumber}</td>
                <td className="px-6 py-4">{o.user?.username || 'Unknown'}</td>
                <td className="px-6 py-4">RM {o.total.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="input w-32 text-sm"
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4"><span className={`badge ${o.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{o.paymentStatus}</span></td>
                <td className="px-6 py-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => viewHistory(o.id)} className="btn btn-secondary px-3 py-1 text-sm flex items-center gap-1">
                    <History className="h-3 w-3" /> View
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => downloadInvoice(o.id)} className="btn btn-secondary px-3 py-1 text-sm flex items-center gap-1">
                    <FileDown className="h-3 w-3" /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No orders yet</p>
            <p className="text-sm mt-1">Orders will appear here once customers start purchasing</p>
          </div>
        )}
      </div>

      {historyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Order Status History</h3>
              <button onClick={() => setHistoryModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {statusHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No status changes recorded</p>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-primary-600" />
                        </div>
                        {idx < statusHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${entry.newStatus === 'cancelled' ? 'badge-error' : entry.newStatus === 'paid' ? 'badge-success' : 'badge-info'}`}>
                            {entry.newStatus}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {entry.notes && <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>}
                        {entry.user && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            {entry.user.username} ({entry.user.role})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}