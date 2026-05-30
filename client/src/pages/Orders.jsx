import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Star, Trash2 } from 'lucide-react';
import { ordersApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const statusIcons = {
    pending: Clock,
    paid: CheckCircle,
    processing: Package,
    shipped: Package,
    delivered: CheckCircle,
    cancelled: XCircle,
  };

  const statusColors = {
    pending: 'badge-warning',
    paid: 'badge-info',
    processing: 'badge-info',
    shipped: 'badge-info',
    delivered: 'badge-success',
    cancelled: 'badge-error',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-500">Loading orders...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="h-20 w-20 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map(order => {
          const StatusIcon = statusIcons[order.status] || Clock;
          
          return (
            <div key={order.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">Order #{order.orderNumber}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge ${statusColors[order.status]}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {order.status}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium">{order.items?.length || 0} product(s)</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium text-primary-600">RM {order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment</p>
                    <p className="font-medium">{order.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery</p>
                    <p className="font-medium">{order.deliveryType}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="btn btn-error flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Cancel
                  </button>
                )}
                {order.status === 'delivered' && (
                  <Link to={`/orders/${order.id}/review`} className="btn btn-secondary flex items-center gap-2">
                    <Star className="h-4 w-4" /> Review
                  </Link>
                )}
                <Link to={`/orders/${order.id}`} className="btn btn-secondary">
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}