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

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

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

  if (loading) return <div className="animate-pulse">Loading order details...</div>;
  if (!order) return <div>Order not found</div>;

  const StatusIcon = statusIcons[order.status] || Clock;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/orders" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <StatusIcon className="h-6 w-6" />
                <span className={`badge ${statusColors[order.status]}`}>{order.status}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-3">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <Link to={`/products/${item.product?.slug}`} className="font-medium hover:text-primary-600">
                        {item.product?.name || 'Product'}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-gray-500">{item.variant.variantName}: {item.variant.variantValue}</p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {order.statusHistory?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Order History</h3>
              <div className="space-y-2">
                {order.statusHistory.map(history => (
                  <div key={history.id} className="flex items-center gap-3 py-2 border-b">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">{history.newStatus}</span>
                      <p className="text-sm text-gray-500">
                        {new Date(history.createdAt).toLocaleString()}
                        {history.notes && ` - ${history.notes}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>RM {order.subtotal?.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-RM {order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>RM {order.shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-primary-600">RM {order.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-gray-500">Payment:</span> {order.paymentStatus}</p>
              <p><span className="text-gray-500">Method:</span> {order.paymentMethod || 'N/A'}</p>
              <p><span className="text-gray-500">Delivery:</span> {order.deliveryType}</p>
            </div>
          </div>

          {order.shippingAddress && (
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Shipping Address</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><User className="h-4 w-4" /> {order.shippingName}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {order.shippingPhone}</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {order.shippingAddress}</p>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="card p-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          <div className="space-y-2">
            {order.status === 'pending' && (
              <button onClick={cancelOrder} className="btn btn-error w-full">Cancel Order</button>
            )}
            {order.status === 'delivered' && (
              <Link to={`/orders/${orderId}/review`} className="btn btn-secondary w-full block text-center">Write Review</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
