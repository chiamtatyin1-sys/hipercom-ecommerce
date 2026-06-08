import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, ArrowLeft, MapPin, Phone, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrder(); }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) {
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Order cancelled');
      fetchOrder();
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
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded w-1/4" />
      <div className="h-40 bg-slate-200 rounded-xl" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20">
      <h2 className="text-lg font-semibold text-slate-900">Order not found</h2>
      <Link to="/orders" className="btn btn-primary btn-sm mt-4">Back to Orders</Link>
    </div>
  );

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusColor = statusConfig[order.status]?.color || 'badge-neutral';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="btn btn-outline btn-sm">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card-static p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5 text-slate-600" />
                <span className={`badge ${statusColor}`}>{order.status}</span>
              </div>
              <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Items</h3>
              <div className="space-y-3">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <Link to={`/products/${item.product?.slug}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
                        {item.product?.name || 'Product'}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-slate-400">{item.variant.variantName}: {item.variant.variantValue}</p>
                      )}
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-700">RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {order.statusHistory?.length > 0 && (
            <div className="card-static p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Order History</h3>
              <div className="space-y-2">
                {order.statusHistory.map(history => (
                  <div key={history.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                    <Clock className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-slate-700">{history.newStatus}</span>
                      <p className="text-xs text-slate-400">{new Date(history.createdAt).toLocaleString()}</p>
                      {history.notes && <p className="text-xs text-slate-500 mt-0.5">{history.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-static p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700">RM {order.subtotal?.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-RM {order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span className="text-slate-700">RM {order.shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-2 text-slate-900">
                <span>Total</span>
                <span>RM {order.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p><span className="text-slate-400">Payment:</span> {order.paymentStatus}</p>
              <p><span className="text-slate-400">Method:</span> {order.paymentMethod || 'N/A'}</p>
              <p><span className="text-slate-400">Delivery:</span> {order.deliveryType}</p>
            </div>
          </div>

          {order.shippingAddress && (
            <div className="card-static p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Shipping Address</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-slate-600"><User className="h-4 w-4 text-slate-400" /> {order.shippingName}</p>
                <p className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {order.shippingPhone}</p>
                <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" /> {order.shippingAddress}</p>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="card-static p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600">{order.notes}</p>
            </div>
          )}

          <div className="space-y-2">
            {order.status === 'pending' && (
              <button onClick={cancelOrder} className="btn btn-outline w-full text-red-500 border-red-200 hover:border-red-300 btn-sm">Cancel Order</button>
            )}
            {order.status === 'delivered' && (
              <Link to={`/orders/${orderId}/review`} className="btn btn-secondary w-full btn-sm">Write a Review</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}