import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, History, User, Copy, Check, Calendar, MapPin, Phone, CreditCard } from 'lucide-react';
import api, { ordersApi } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'paid', label: 'Payment Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const getEstimatedDelivery = (order) => {
  if (!order || order.status === 'delivered' || order.status === 'cancelled') return null;
  const created = new Date(order.createdAt);
  const days = order.deliveryType === 'pickup' ? 1 : order.status === 'shipped' ? 2 : 5;
  const est = new Date(created);
  est.setDate(est.getDate() + days);
  return est;
};

export default function OrderTracking() {
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (user) fetchRecentOrders();
  }, [user]);

  const fetchRecentOrders = async () => {
    try {
      const res = await ordersApi.getAll();
      setRecentOrders((res.data.orders || []).slice(0, 3));
    } catch {
      // ignore
    }
  };

  const trackOrder = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return toast.error('Enter order number');
    setLoading(true);
    setError('');
    setOrder(null);
    setStatusHistory([]);
    try {
      const res = await api.get(`/orders/track/${orderNumber.trim()}`);
      setOrder(res.data);
      try {
        const historyRes = await ordersApi.getStatusHistory(res.data.id);
        setStatusHistory(historyRes.data.statusHistory || []);
      } catch {
        // Status history is optional
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success('Order number copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickTrack = async (orderNum) => {
    setOrderNumber(orderNum);
    setLoading(true);
    setError('');
    setOrder(null);
    setStatusHistory([]);
    try {
      const res = await api.get(`/orders/track/${orderNum}`);
      setOrder(res.data);
      try {
        const historyRes = await ordersApi.getStatusHistory(res.data.id);
        setStatusHistory(historyRes.data.statusHistory || []);
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = statusSteps.findIndex(s => s.key === order?.status);
  const estimatedDelivery = getEstimatedDelivery(order);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Track Your Order</h1>
          <p className="text-gray-500 mt-2">Enter your order number to check delivery status</p>
        </div>

        <form onSubmit={trackOrder} className="card p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="e.g. HC-20260518-001"
              className="input flex-1"
            />
            <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
              <Search className="h-4 w-4" /> {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {user && recentOrders.length > 0 && !order && (
          <div className="card p-6 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Recent Orders
            </h3>
            <div className="space-y-2">
              {recentOrders.map(o => (
                <button
                  key={o.id}
                  onClick={() => quickTrack(o.orderNumber)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">#{o.orderNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] || 'bg-gray-100 text-gray-700'}`}>
                      {o.status}
                    </span>
                    <span className="font-medium text-sm">RM {o.total.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="card p-6 bg-red-50 border border-red-200 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">Order #{order.orderNumber}</h2>
                    <button onClick={copyOrderNumber} className="p-1 hover:bg-gray-100 rounded transition-colors">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {estimatedDelivery && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Estimated delivery: <strong>{estimatedDelivery.toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentStatusIndex;
                    const isCurrent = i === currentStatusIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'} ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className={`text-xs mt-2 text-center hidden sm:block ${isActive ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="relative h-1 bg-gray-200 rounded">
                  <div
                    className="absolute h-full bg-primary-500 rounded transition-all"
                    style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Payment</p>
                    <p className="font-medium">{order.paymentStatus}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-medium text-lg text-primary-600">RM {order.total.toFixed(2)}</p>
                </div>
                {order.shippingName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Shipping To</p>
                      <p className="font-medium">{order.shippingName}</p>
                    </div>
                  </div>
                )}
                {order.shippingPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">{order.shippingPhone}</p>
                    </div>
                  </div>
                )}
              </div>
              {order.shippingAddress && (
                <div className="mt-3 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500 text-sm">Address</p>
                    <p className="font-medium text-sm">{order.shippingAddress}</p>
                  </div>
                </div>
              )}
            </div>

            {statusHistory.length > 0 && (
              <div className="card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <History className="h-4 w-4" /> Order Status History
                </h3>
                <div className="space-y-4">
                  {statusHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[entry.newStatus] || 'bg-gray-100 text-gray-700'}`}>
                          <Clock className="h-4 w-4" />
                        </div>
                        {idx < statusHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.newStatus] || 'bg-gray-100 text-gray-700'}`}>
                            {entry.newStatus.charAt(0).toUpperCase() + entry.newStatus.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleString('en-MY')}
                          </span>
                        </div>
                        {entry.notes && <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="font-bold mb-4">Order Items</h3>
              <div className="divide-y">
                {order.items?.map(item => (
                  <div key={item.id} className="py-3 flex justify-between items-center">
                    <div>
                      <Link to={`/products/${item.product?.slug}`} className="font-medium hover:text-primary-600">
                        {item.product?.name || 'Product'}
                      </Link>
                      {item.variant && <p className="text-sm text-gray-500">{item.variant.variantName}: {item.variant.variantValue}</p>}
                      <p className="text-sm text-gray-500">Qty: {item.quantity} x RM {item.price.toFixed(2)}</p>
                    </div>
                    <p className="font-medium">RM {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>RM {order.subtotal?.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-RM {order.discount.toFixed(2)}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span>RM {order.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total</span>
                  <span className="text-primary-600">RM {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
