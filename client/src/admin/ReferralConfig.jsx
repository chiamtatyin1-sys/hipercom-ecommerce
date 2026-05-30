import { useState, useEffect } from 'react';
import { Users, Percent, DollarSign, Save } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminReferralConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    referrerRewardType: 'percentage',
    referrerRewardValue: 5,
    refereeDiscountType: 'percentage',
    refereeDiscountValue: 10,
    minOrderAmount: 0,
    maxUses: 0,
    isActive: true,
  });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/referrals/config');
      setConfig(res.data);
      if (res.data) {
        setFormData({
          referrerRewardType: res.data.referrerRewardType || 'percentage',
          referrerRewardValue: res.data.referrerRewardValue || 5,
          refereeDiscountType: res.data.refereeDiscountType || 'percentage',
          refereeDiscountValue: res.data.refereeDiscountValue || 10,
          minOrderAmount: res.data.minOrderAmount || 0,
          maxUses: res.data.maxUses || 0,
          isActive: res.data.isActive !== false,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (config?.id) {
        await api.put(`/referrals/config/${config.id}`, formData);
        toast.success('Referral config updated');
      } else {
        await api.post('/referrals/config', formData);
        toast.success('Referral config created');
      }
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading referral config...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Referral Configuration</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Percent className="h-5 w-5" /> Referrer Reward</h3>
          <p className="text-sm text-gray-500 mb-4">What the person who shares the referral code gets</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reward Type</label>
              <select value={formData.referrerRewardType} onChange={(e) => setFormData({ ...formData, referrerRewardType: e.target.value })} className="input">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (RM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reward Value</label>
              <div className="relative">
                <input type="number" step="0.01" value={formData.referrerRewardValue} onChange={(e) => setFormData({ ...formData, referrerRewardValue: parseFloat(e.target.value) || 0 })} className="input pr-10" />
                <span className="absolute right-3 top-2.5 text-gray-400">{formData.referrerRewardType === 'percentage' ? '%' : 'RM'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5" /> Referee Discount</h3>
          <p className="text-sm text-gray-500 mb-4">What the new customer gets when using a referral code</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <select value={formData.refereeDiscountType} onChange={(e) => setFormData({ ...formData, refereeDiscountType: e.target.value })} className="input">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (RM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Value</label>
              <div className="relative">
                <input type="number" step="0.01" value={formData.refereeDiscountValue} onChange={(e) => setFormData({ ...formData, refereeDiscountValue: parseFloat(e.target.value) || 0 })} className="input pr-10" />
                <span className="absolute right-3 top-2.5 text-gray-400">{formData.refereeDiscountType === 'percentage' ? '%' : 'RM'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Rules</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Order Amount (RM)</label>
              <input type="number" step="0.01" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })} className="input" />
              <p className="text-xs text-gray-500 mt-1">0 = no minimum</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Uses Per Code</label>
              <input type="number" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })} className="input" />
              <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Referral Program Active</label>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Preview</h3>
          <div className="bg-gray-50 p-4 rounded space-y-3">
            <div className="flex justify-between text-sm">
              <span>Referrer gets:</span>
              <span className="font-bold text-green-600">
                {formData.referrerRewardType === 'percentage' ? `${formData.referrerRewardValue}% of order` : `RM ${formData.referrerRewardValue.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>New customer gets:</span>
              <span className="font-bold text-blue-600">
                {formData.refereeDiscountType === 'percentage' ? `${formData.refereeDiscountValue}% off` : `RM ${formData.refereeDiscountValue.toFixed(2)} off`}
              </span>
            </div>
            {formData.minOrderAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Min order:</span>
                <span className="font-medium">RM {formData.minOrderAmount.toFixed(2)}</span>
              </div>
            )}
            {formData.maxUses > 0 && (
              <div className="flex justify-between text-sm">
                <span>Max uses:</span>
                <span className="font-medium">{formData.maxUses}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className={`font-bold ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>{formData.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
