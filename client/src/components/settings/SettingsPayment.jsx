import { CreditCard, DollarSign, ToggleLeft } from 'lucide-react';

export default function SettingsPayment({ settings, updateSetting }) {
  const paymentMethods = [
    { key: 'payment_card', label: 'Credit/Debit Card', desc: 'Via HitPay' },
    { key: 'payment_grabpay', label: 'GrabPay', desc: 'E-wallet' },
    { key: 'payment_shopeepay', label: 'ShopeePay', desc: 'E-wallet' },
    { key: 'payment_fpx', label: 'FPX', desc: 'Online banking' },
    { key: 'payment_cod', label: 'Cash on Delivery', desc: 'Pay at pickup/delivery' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Payment Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure payment gateways and methods</p>
      </div>

      {/* HitPay Config */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4" /> HitPay Gateway</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">API URL</label>
            <input type="text" value={settings.hitpay_api_url || 'https://api.hit-pay.com'} onChange={(e) => updateSetting('hitpay_api_url', e.target.value)} className="input" placeholder="https://api.hit-pay.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input type="password" value={settings.hitpay_api_key || ''} onChange={(e) => updateSetting('hitpay_api_key', e.target.value)} className="input" placeholder="live_xxx..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salt</label>
            <input type="password" value={settings.hitpay_salt || ''} onChange={(e) => updateSetting('hitpay_salt', e.target.value)} className="input" placeholder="Your salt key" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Checkout Link</label>
            <input type="text" value={settings.hitpay_default_link || ''} onChange={(e) => updateSetting('hitpay_default_link', e.target.value)} className="input" placeholder="https://securecheckout.hit-pay.com/..." />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Note: HitPay credentials are also stored in .env for security. Changes here override .env values.</p>
      </div>

      {/* Payment Methods */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><ToggleLeft className="h-4 w-4" /> Payment Methods</h4>
        <div className="space-y-3">
          {paymentMethods.map(method => (
            <div key={method.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{method.label}</p>
                <p className="text-xs text-gray-500">{method.desc}</p>
              </div>
              <button
                onClick={() => updateSetting(method.key, settings[method.key] !== 'false')}
                className={`w-12 h-6 rounded-full transition-colors ${settings[method.key] !== 'false' ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings[method.key] !== 'false' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Currency</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Default Currency</label>
            <select value={settings.default_currency || 'MYR'} onChange={(e) => updateSetting('default_currency', e.target.value)} className="input">
              <option value="MYR">MYR - Malaysian Ringgit</option>
              <option value="USD">USD - US Dollar</option>
              <option value="SGD">SGD - Singapore Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency Symbol</label>
            <input type="text" value={settings.currency_symbol || 'RM'} onChange={(e) => updateSetting('currency_symbol', e.target.value)} className="input" placeholder="RM" />
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div>
        <h4 className="font-medium mb-4">Payment Terms</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Expiry (hours)</label>
            <input type="number" value={settings.invoice_expiry_hours || '24'} onChange={(e) => updateSetting('invoice_expiry_hours', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Auto-cancel unpaid orders (hours)</label>
            <input type="number" value={settings.auto_cancel_hours || '48'} onChange={(e) => updateSetting('auto_cancel_hours', e.target.value)} className="input" />
          </div>
        </div>
      </div>
    </div>
  );
}
