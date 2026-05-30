import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function PaymentComplete() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);

  const orderNumber = searchParams.get('order');

  useEffect(() => {
    if (orderNumber) {
      checkPaymentStatus();
    }
  }, [orderNumber]);

  const checkPaymentStatus = async () => {
    try {
      const res = await api.get('/orders');
      const foundOrder = res.data.orders?.find(o => o.orderNumber === orderNumber);
      
      if (foundOrder) {
        setOrder(foundOrder);
        setStatus(foundOrder.paymentStatus === 'paid' ? 'success' : 'pending');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-16 w-16 mx-auto text-primary-600 animate-spin mb-4" />
          <h2 className="text-2xl font-semibold">Processing Payment...</h2>
          <p className="text-gray-500 mt-2">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">Thank you for your purchase. Your order has been confirmed.</p>
          </div>
          
          {order && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="text-xl font-bold">{order.orderNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product?.name || 'Product'} x {item.quantity}</span>
                    <span className="font-medium">RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Total Paid</span>
                  <span className="text-xl font-bold text-primary-600">RM {order.total.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(order.createdAt).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/orders" className="btn btn-primary flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> View Orders
            </Link>
            <Link to="/products" className="btn btn-secondary flex items-center justify-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-8">There was an issue processing your payment. Please try again.</p>
        <Link to="/cart" className="btn btn-primary inline-flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" /> Back to Cart
        </Link>
      </div>
    </div>
  );
}
