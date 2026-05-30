import { useState, useEffect } from 'react';
import { Settings, Globe, CreditCard, Truck, Bell, Bot, Mail, Shield, Search, Hash, Database, Save } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import SettingsGeneral from '../components/settings/SettingsGeneral';
import SettingsPayment from '../components/settings/SettingsPayment';
import SettingsShipping from '../components/settings/SettingsShipping';
import SettingsNotifications from '../components/settings/SettingsNotifications';
import SettingsAI from '../components/settings/SettingsAI';
import SettingsEmail from '../components/settings/SettingsEmail';
import SettingsSecurity from '../components/settings/SettingsSecurity';
import SettingsSEO from '../components/settings/SettingsSEO';
import SettingsTax from '../components/settings/SettingsTax';
import SettingsSystem from '../components/settings/SettingsSystem';

const tabs = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ai', label: 'AI & Chatbot', icon: Bot },
  { id: 'email', label: 'Email (SMTP)', icon: Mail },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'seo', label: 'SEO & Analytics', icon: Search },
  { id: 'tax', label: 'Tax', icon: Hash },
  { id: 'system', label: 'System', icon: Database },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState({});

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
      setLocalSettings(res.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const changes = Object.entries(localSettings).filter(([key, value]) => settings[key] !== value);
      await Promise.all(changes.map(([key, value]) => api.put('/settings', { key, value })));
      setSettings(localSettings);
      setHasChanges(false);
      toast.success('All settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading settings...</span>
    </div>
  );

  const ActiveComponent = {
    general: SettingsGeneral,
    payment: SettingsPayment,
    shipping: SettingsShipping,
    notifications: SettingsNotifications,
    ai: SettingsAI,
    email: SettingsEmail,
    security: SettingsSecurity,
    seo: SettingsSEO,
    tax: SettingsTax,
    system: SettingsSystem,
  }[activeTab];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" /> Settings
        </h2>
        {hasChanges && (
          <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        )}
      </div>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow-sm p-2 sticky top-24">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ActiveComponent settings={localSettings} updateSetting={updateSetting} />
          </div>
        </div>
      </div>
    </div>
  );
}
