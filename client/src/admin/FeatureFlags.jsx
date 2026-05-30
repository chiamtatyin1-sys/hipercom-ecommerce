import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ToggleLeft, ToggleRight, RefreshCw, Settings, Shield, ShoppingCart, MessageSquare, BarChart3, Gift, Star, Bell, Key, Layers, FileText, Mail, Zap, Tag, Users, Heart } from 'lucide-react';

const FEATURE_ICONS = {
  enableReviews: Star,
  enableWishlist: Heart,
  enableCoupons: Tag,
  enableReferrals: Users,
  enableLoyaltyPoints: Gift,
  enableProductComparison: Layers,
  enablePriceAlerts: Bell,
  enableGiftCards: Gift,
  enableSubscriptions: RefreshCw,
  enableAdvancedAnalytics: BarChart3,
  enableAIRecommendations: Zap,
  enableChatBot: MessageSquare,
  enableNotifications: Bell,
  enableMultiWarehouse: Layers,
  enableStockTransfer: ShoppingCart,
  enableBulkOperations: FileText,
  enableAPIAccess: Key,
  enableCustomBranding: Settings,
  enableAdvancedSEO: Shield,
  enableEmailMarketing: Mail,
};

const FEATURE_DESCRIPTIONS = {
  enableReviews: 'Allow customers to leave product reviews and ratings',
  enableWishlist: 'Enable wishlist functionality for customers',
  enableCoupons: 'Allow creation and use of coupon codes',
  enableReferrals: 'Enable referral program for customers',
  enableLoyaltyPoints: 'Reward customers with loyalty points on purchases',
  enableProductComparison: 'Allow customers to compare products side-by-side',
  enablePriceAlerts: 'Notify customers when product prices drop',
  enableGiftCards: 'Enable purchase and redemption of gift cards',
  enableSubscriptions: 'Allow recurring subscription orders',
  enableAdvancedAnalytics: 'Access detailed sales and customer analytics',
  enableAIRecommendations: 'Show AI-powered product recommendations',
  enableChatBot: 'Enable AI chatbot for customer support',
  enableNotifications: 'Send in-app notifications to users',
  enableMultiWarehouse: 'Manage inventory across multiple warehouses',
  enableStockTransfer: 'Transfer stock between warehouses',
  enableBulkOperations: 'Bulk update and delete products',
  enableAPIAccess: 'Generate API keys for external integrations',
  enableCustomBranding: 'Customize store branding and themes',
  enableAdvancedSEO: 'Advanced SEO optimization tools',
  enableEmailMarketing: 'Email marketing campaigns and automation',
};

export default function FeatureFlags() {
  const { user } = useAuth();
  const [features, setFeatures] = useState({});
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const res = await api.get('/features');
      setFeatures(res.data.features);
      setDefaults(res.data.defaults);
    } catch (error) {
      toast.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (feature, currentEnabled) => {
    setSaving(prev => ({ ...prev, [feature]: true }));
    try {
      await api.put(`/features/${feature}`, { isEnabled: !currentEnabled });
      setFeatures(prev => ({
        ...prev,
        [feature]: { ...prev[feature], isEnabled: !currentEnabled },
      }));
      toast.success(`Feature ${!currentEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle feature');
    } finally {
      setSaving(prev => ({ ...prev, [feature]: false }));
    }
  };

  const resetFeatures = async () => {
    if (!window.confirm('Reset all features to defaults?')) return;
    try {
      await api.post('/features/reset');
      await fetchFeatures();
      toast.success('Features reset to defaults');
    } catch (error) {
      toast.error('Failed to reset features');
    }
  };

  const enabledCount = Object.values(features).filter(f => f.isEnabled).length;
  const totalCount = Object.keys(features).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feature Flags</h1>
          <p className="text-gray-600 mt-1">
            Enable or disable features for your store. Changes take effect immediately.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-primary-600">{enabledCount}</span> / {totalCount} enabled
          </div>
          <button
            onClick={resetFeatures}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(features).map(([key, value]) => {
          const Icon = FEATURE_ICONS[key] || Settings;
          const description = FEATURE_DESCRIPTIONS[key] || 'No description available';

          return (
            <div
              key={key}
              className={`card p-4 border-2 transition-colors ${
                value.isEnabled ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${value.isEnabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeature(key, value.isEnabled)}
                  disabled={saving[key]}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value.isEnabled ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
