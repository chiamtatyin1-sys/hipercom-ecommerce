import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building, MapPin, Tag, CheckCircle, XCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { items, subtotal, refreshCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryType: 'shipping',
    addressId: '',
    pickupBranchId: '',
    referralCode: '',
    couponCode: '',
    notes: '',
  });
  const [couponResult, setCouponResult] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchBranches();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data || []);
      // Auto-select default address
      const defaultAddr = res.data?.find(a => a.isDefault);
      if (defaultAddr) {
        setFormData(prev => ({ ...prev, addressId: defaultAddr.id }));
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/warehouses');
      setBranches(res.data || []);
      // Auto-select first branch
      if (res.data?.length > 0) {
        setFormData(prev => ({ ...prev, pickupBranchId: res.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const validateCoupon = async () => {
    if (!formData.couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponResult(null);
    try {
      const res = await api.post('/coupons/validate', { code: formData.couponCode, orderAmount: subtotal });
      setCouponResult(res.data);
      toast.success(`Coupon applied! You save RM ${res.data.discount.toFixed(2)}`);
    } catch (error) {
      setCouponResult({ error: error.response?.data?.error || 'Invalid coupon' });
      toast.error(error.response?.data?.error || 'Invalid coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setFormData({ ...formData, couponCode: '' });
    setCouponResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Refresh cart to ensure we have latest data
      await refreshCart();

      // Validate
      if (formData.deliveryType === 'shipping' && !formData.addressId) {
        toast.error('Please select a shipping address');
        setLoading(false);
        return;
      }
      if (formData.deliveryType === 'pickup' && !formData.pickupBranchId) {
        toast.error('Please select a pickup branch');
        setLoading(false);
        return;
      }

      if (items.length === 0) {
        toast.error('Cart is empty');
        setLoading(false);
        navigate('/cart');
        return;
      }

      // Create order
      const orderData = {
        items: items.map(item => ({
          cartItemId: item.id,
          quantity: item.quantity,
        })),
        deliveryType: formData.deliveryType,
        addressId: formData.addressId,
        pickupBranchId: formData.pickupBranchId,
        referralCode: formData.referralCode,
        couponCode: couponResult?.code || null,
        notes: formData.notes,
      };

      const orderRes = await api.post('/orders', orderData);
      const order = orderRes.data;

      // Create payment
      const paymentRes = await api.post(`/payments/create/${order.id}`);
      
      if (paymentRes.data.paymentUrl) {
        window.location.href = paymentRes.data.paymentUrl;
      } else {
        toast.error('Payment URL not received');
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Checkout failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (items.length === 0) {
      navigate('/cart');
    }
  }, [user, items, navigate]);

  if (!user || items.length === 0) {
    return null;
  }

  const shippingCost = formData.deliveryType === 'shipping' ? (settings.shippingFlatRate || 5) : 0;
  const couponDiscount = couponResult?.discount || 0;
  const taxRate = settings.taxEnabled ? (settings.taxRate || 6) : 0;
  const tax = (subtotal - couponDiscount) * (taxRate / 100);
  const total = subtotal - couponDiscount + shippingCost + tax;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Type */}
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Delivery Method</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className={`border rounded-lg p-4 cursor-pointer ${formData.deliveryType === 'shipping' ? 'border-primary-600 bg-primary-50' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryType"
                    value="shipping"
                    checked={formData.deliveryType === 'shipping'}
                    onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                    className="hidden"
                  />
                  <MapPin className="h-6 w-6 mb-2 text-primary-600" />
                  <span className="font-medium">Shipping</span>
                  <p className="text-sm text-gray-500">RM 5</p>
                </label>
                <label className={`border rounded-lg p-4 cursor-pointer ${formData.deliveryType === 'pickup' ? 'border-primary-600 bg-primary-50' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryType"
                    value="pickup"
                    checked={formData.deliveryType === 'pickup'}
                    onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                    className="hidden"
                  />
                  <Building className="h-6 w-6 mb-2 text-primary-600" />
                  <span className="font-medium">Pickup</span>
                  <p className="text-sm text-gray-500">Free</p>
                </label>
              </div>

              {/* Address Selection for Shipping */}
              {formData.deliveryType === 'shipping' && (
                <div>
                  <h4 className="font-medium mb-2">Select Shipping Address</h4>
                  {addresses.length === 0 ? (
                    <p className="text-gray-500 text-sm">No addresses saved. Please add an address in your profile.</p>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map(addr => (
                        <label key={addr.id} className={`block border rounded-lg p-3 cursor-pointer ${formData.addressId === addr.id ? 'border-primary-600 bg-primary-50' : ''}`}>
                          <input
                            type="radio"
                            name="addressId"
                            value={addr.id}
                            checked={formData.addressId === addr.id}
                            onChange={(e) => setFormData({ ...formData, addressId: e.target.value })}
                            className="hidden"
                          />
                          <div className="text-sm">
                            <p className="font-medium">{addr.name} {addr.isDefault && <span className="text-xs text-primary-600">(Default)</span>}</p>
                            <p className="text-gray-600">{addr.address}, {addr.city}, {addr.state} {addr.postalCode}</p>
                            <p className="text-gray-500">{addr.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Branch Selection for Pickup */}
              {formData.deliveryType === 'pickup' && (
                <div>
                  <h4 className="font-medium mb-2">Select Pickup Branch</h4>
                  {branches.length === 0 ? (
                    <p className="text-gray-500 text-sm">No branches available for pickup.</p>
                  ) : (
                    <div className="space-y-2">
                      {branches.map(branch => (
                        <label key={branch.id} className={`block border rounded-lg p-3 cursor-pointer ${formData.pickupBranchId === branch.id ? 'border-primary-600 bg-primary-50' : ''}`}>
                          <input
                            type="radio"
                            name="pickupBranchId"
                            value={branch.id}
                            checked={formData.pickupBranchId === branch.id}
                            onChange={(e) => setFormData({ ...formData, pickupBranchId: e.target.value })}
                            className="hidden"
                          />
                          <div className="text-sm">
                            <p className="font-medium">{branch.name} {branch.isDefault && <span className="text-xs text-primary-600">(Default)</span>}</p>
                            <p className="text-gray-600">{branch.address}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coupon & Referral */}
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Discount Codes</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Coupon Code</label>
                {couponResult && !couponResult.error ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{couponResult.code}</span>
                    <span className="text-sm text-green-600">-RM {couponResult.discount.toFixed(2)}</span>
                    <button onClick={removeCoupon} className="ml-auto text-red-500 hover:text-red-700">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                      placeholder="Enter coupon code"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={validateCoupon}
                      disabled={validatingCoupon || !formData.couponCode.trim()}
                      className="btn btn-secondary"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Referral Code</label>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  placeholder="Enter referral code"
                  className="input"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Order Notes (Optional)</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special instructions for your order..."
                className="input h-24"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="card p-6 h-fit">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span>{settings.currency} {(item.totalPrice || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{settings.currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{settings.currency} {shippingCost.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({taxRate}%)</span>
                  <span>{settings.currency} {tax.toFixed(2)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{settings.currency} {couponDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{settings.currency} {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-6 flex items-center justify-center"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay with HitPay
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              You'll be redirected to HitPay to complete your payment securely.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}