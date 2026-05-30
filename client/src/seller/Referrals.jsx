import { useState, useEffect } from 'react';
import { referralApi } from '../services/api';
import { DollarSign } from 'lucide-react';

export default function SellerReferrals() {
  const [config, setConfig] = useState(null);
  const [referrals, setReferrals] = useState({ referrals: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [configRes, refsRes] = await Promise.all([
        referralApi.getConfig(),
        referralApi.getMyReferrals(),
      ]);
      setConfig(configRes.data);
      setReferrals(refsRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading referrals...</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Referral Program</h2>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center mb-2">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-gray-500 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold">RM {referrals.stats.totalEarnings?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <p className="text-gray-500 text-sm">Total Referrals</p>
          <p className="text-2xl font-bold">{referrals.stats.totalReferrals || 0}</p>
        </div>
        <div className="card p-6">
          <p className="text-gray-500 text-sm">Successful</p>
          <p className="text-2xl font-bold">{referrals.stats.successfulReferrals || 0}</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Referral Settings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Referrer Reward Type</p>
            <p className="font-medium capitalize">{config?.referrerRewardType || 'percentage'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Referrer Reward Value</p>
            <p className="font-medium">{config?.referrerRewardValue || 5}%</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Referee Discount Type</p>
            <p className="font-medium capitalize">{config?.refereeDiscountType || 'percentage'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Referee Discount Value</p>
            <p className="font-medium">{config?.refereeDiscountValue || 10}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}