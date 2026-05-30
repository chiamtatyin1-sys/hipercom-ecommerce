import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { referralApi, settingsApi, usersApi } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function SellerSettings() {
  const { user } = useAuth();
  const [referralConfig, setReferralConfig] = useState({});
  const [allowAIInventoryCheck, setAllowAIInventoryCheck] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const [referralRes, settingsRes] = await Promise.all([
        referralApi.getConfig(),
        settingsApi.get(),
      ]);
      setReferralConfig(referralRes.data || {});
      
      if (user?.id) {
        const userRes = await usersApi.getById(user.id);
        setAllowAIInventoryCheck(userRes.data.allowAIInventoryCheck !== false);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      await referralApi.updateConfig(referralConfig);
      
      if (user?.id) {
        await usersApi.update(user.id, { allowAIInventoryCheck });
      }
      
      toast.success('Settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading settings...</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* Referral Settings */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Referral Program Configuration</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Referrer Reward Type</label>
            <select
              value={referralConfig.referrerRewardType || 'percentage'}
              onChange={e => setReferralConfig({ ...referralConfig, referrerRewardType: e.target.value })}
              className="input"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Referrer Reward Value (%)</label>
            <input
              type="number"
              value={referralConfig.referrerRewardValue || 5}
              onChange={e => setReferralConfig({ ...referralConfig, referrerRewardValue: parseFloat(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Referee Discount Type</label>
            <select
              value={referralConfig.refereeDiscountType || 'percentage'}
              onChange={e => setReferralConfig({ ...referralConfig, refereeDiscountType: e.target.value })}
              className="input"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Referee Discount Value</label>
            <input
              type="number"
              value={referralConfig.refereeDiscountValue || 10}
              onChange={e => setReferralConfig({ ...referralConfig, refereeDiscountValue: parseFloat(e.target.value) })}
              className="input"
            />
          </div>
        </div>
        <button onClick={handleSave} className="btn btn-primary mt-4 flex items-center">
          <Save className="h-4 w-4 mr-2" />Save Settings
        </button>
      </div>

      {/* AI Inventory Check Setting */}
      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">AI Assistant Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Allow AI to Check Inventory</p>
            <p className="text-sm text-gray-500">Let JARVIS AI access your product inventory levels to answer customer queries</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={allowAIInventoryCheck}
              onChange={e => setAllowAIInventoryCheck(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}