import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { ordersApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersApi.getAll();
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersApi.cancel(orderId);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'badge-warning' },
    paid: { icon: CheckCircle, color: 'badge-info' },
    processing: { icon: Package, color: 'badge-info' },
    shipped: { icon: Package, color: 'badge-info' },
    delivered: { icon: CheckCircle, color: 'badge-success' },
    cancelled: { icon: XCircle, color: 'badge-error' },
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-slate-500 text-sm">Loading orders...</span>
    </div>
  );

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Package className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No orders yet</h2>
        <p className="text-sm text-slate-500 mb-4">Start shopping to see your orders here.</p>
        <Link to="/products" className="btn btn-primary btn-sm">Browse Products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>

      <div className="space-y-3">
        {orders.map(order => {
          const StatusIcon = statusConfig[order.status]?.icon || Clock;
          const statusColor = statusConfig[order.status]?.color || 'badge-neutral';

          return (
            <div key={order.id} className="card-static p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-900">Order #{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${statusColor}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {order.status}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Items</p>
                    <p className="font-medium text-slate-700">{order.items?.length || 0} product(s)</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="font-bold text-slate-900">RM {order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Payment</p>
                    <p className="font-medium text-slate-700">{order.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Delivery</p>
                    <p className="font-medium text-slate-700">{order.deliveryType}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {order.status === 'pending' && (
                  <button onClick={() => cancelOrder(order.id)} className="btn btn-sm btn-outline text-red-500 hover:text-red-600 border-red-200 hover:border-red-300">
                    Cancel
                  </button>
                )}
                {order.status === 'delivered' && (
                  <Link to={`/orders/${order.id}/review`} className="btn btn-sm btn-outline">
                    <Star className="h-3 w-3 mr-1" /> Review
                  </Link>
                )}
                <Link to={`/orders/${order.id}`} className="btn btn-sm btn-secondary">View Details</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}