import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle, XCircle, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscount: null,
    usageLimit: 0,
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/coupons/${editing.id}`, form);
        toast.success('Coupon updated');
      } else {
        await api.post('/coupons', form);
        toast.success('Coupon created');
      }
      fetchCoupons();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save coupon');
    }
  };

  const resetForm = () => {
    setForm({ code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderAmount: 0, maxDiscount: null, usageLimit: 0, startDate: '', endDate: '', isActive: true });
    setEditing(null);
    setShowForm(false);
  };

  const editCoupon = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const isExpired = (coupon) => coupon.endDate && new Date(coupon.endDate) < new Date();
  const isNotStarted = (coupon) => coupon.startDate && new Date(coupon.startDate) > new Date();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading coupons...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-8 w-8" /> Coupons & Discounts
        </h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editing ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" placeholder="SAVE20" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="20% off all products" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (RM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value *</label>
                <input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Order Amount (RM)</label>
                <input type="number" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Discount (RM)</label>
                <input type="number" step="0.01" value={form.maxDiscount || ''} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? parseFloat(e.target.value) : null })} className="input" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit (0 = unlimited)</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: parseInt(e.target.value) })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Active</label>
                <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })} className={`w-12 h-6 rounded-full transition-colors mt-2 ${form.isActive ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {coupons.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No coupons yet. Create your first coupon!</p>
          </div>
        ) : (
          coupons.map(coupon => (
            <div key={coupon.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-600">{coupon.code}</span>
                  {coupon.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  {isExpired(coupon) && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Expired</span>}
                  {isNotStarted(coupon) && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Not Started</span>}
                </div>
                {coupon.description && <p className="text-sm text-gray-500 mt-1">{coupon.description}</p>}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `RM ${coupon.discountValue.toFixed(2)}`} off</span>
                  {coupon.minOrderAmount > 0 && <span>Min: RM {coupon.minOrderAmount.toFixed(2)}</span>}
                  {coupon.maxDiscount && <span>Max: RM {coupon.maxDiscount.toFixed(2)}</span>}
                  {coupon.usageLimit > 0 && <span>Used: {coupon.usedCount}/{coupon.usageLimit}</span>}
                  {coupon.endDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(coupon.endDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editCoupon(coupon)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
