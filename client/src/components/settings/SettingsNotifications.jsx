import { Bell, Mail, MessageSquare, Package, Star, AlertTriangle } from 'lucide-react';

export default function SettingsNotifications({ settings, updateSetting }) {
  const notifications = [
    { key: 'notify_new_order', label: 'New Order Received', desc: 'Notify admin when a new order is placed', icon: Package },
    { key: 'notify_order_status', label: 'Order Status Update', desc: 'Email customer when order status changes', icon: Package },
    { key: 'notify_low_stock', label: 'Low Stock Alert', desc: 'Notify when product stock falls below threshold', icon: AlertTriangle },
    { key: 'notify_new_review', label: 'New Review', desc: 'Notify admin when a new product review is submitted', icon: Star },
    { key: 'notify_payment_failed', label: 'Payment Failed', desc: 'Notify admin when a payment fails', icon: AlertTriangle },
    { key: 'notify_referral', label: 'New Referral', desc: 'Notify when a new referral is registered', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Notification Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure email notifications and templates</p>
      </div>

      {/* Notification Toggles */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Bell className="h-4 w-4" /> Email Notifications</h4>
        <div className="space-y-3">
          {notifications.map(n => {
            const Icon = n.icon;
            return (
              <div key={n.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{n.label}</p>
                    <p className="text-xs text-gray-500">{n.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting(n.key, settings[n.key] !== 'false')}
                  className={`w-12 h-6 rounded-full transition-colors ${settings[n.key] !== 'false' ? 'bg-primary-600' : 'bg-gray-300'}`}
                >
                  <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings[n.key] !== 'false' ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Notification Email */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Mail className="h-4 w-4" /> Admin Notifications</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Admin Notification Email</label>
          <input type="email" value={settings.admin_notification_email || ''} onChange={(e) => updateSetting('admin_notification_email', e.target.value)} className="input" placeholder="admin@hipercom.com" />
          <p className="text-xs text-gray-500 mt-1">All admin notifications will be sent to this email</p>
        </div>
      </div>

      {/* Email Templates Preview */}
      <div>
        <h4 className="font-medium mb-4">Email Templates</h4>
        <p className="text-sm text-gray-500 mb-3">Templates are managed through the email service. Current templates:</p>
        <div className="grid grid-cols-2 gap-3">
          {['Welcome Email', 'Order Confirmation', 'Password Reset', 'Order Status Update'].map(t => (
            <div key={t} className="p-3 bg-gray-50 rounded-lg text-sm">
              <span className="font-medium">{t}</span>
              <span className="text-green-600 ml-2 text-xs">✓ Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
