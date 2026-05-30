import { useState, useEffect } from 'react';
import { ordersApi } from '../services/api';
import toast from 'react-hot-toast';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const statusOptions = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading orders...</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Orders</h2>
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="card p-6">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-lg">Order #{order.orderNumber}</p>
                <p className="text-sm text-gray-500">
                  {order.user?.username} • {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge ${
                  order.paymentStatus === 'paid' ? 'badge-success' : 
                  order.paymentStatus === 'refunded' ? 'badge-error' : 'badge-warning'
                }`}>
                  {order.paymentStatus}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="input w-40"
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Items</p>
                <p className="font-medium">{order.items?.length || 0} products</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium text-primary-600">RM {order.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Delivery</p>
                <p className="font-medium capitalize">{order.deliveryType}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium">{order.status}</p>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Order Items:</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.product?.name} x {item.quantity}</span>
                      <span>RM {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here once customers start purchasing</p>
        </div>
      )}
    </div>
  );
}