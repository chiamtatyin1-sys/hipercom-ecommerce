import { Hash } from 'lucide-react';

export default function SettingsTax({ settings, updateSetting }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Tax Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure tax rates and display options</p>
      </div>

      {/* Tax Configuration */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Hash className="h-4 w-4" /> Tax Configuration</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tax Name</label>
            <input type="text" value={settings.tax_name || 'SST'} onChange={(e) => updateSetting('tax_name', e.target.value)} className="input" placeholder="SST" />
            <p className="text-xs text-gray-500 mt-1">GST, SST, VAT, etc.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
            <input type="number" step="0.01" value={settings.tax_rate || '6'} onChange={(e) => updateSetting('tax_rate', e.target.value)} className="input" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm">Tax Enabled</p>
            <p className="text-xs text-gray-500">Apply tax to all orders</p>
          </div>
          <button
            onClick={() => updateSetting('tax_enabled', settings.tax_enabled !== 'false')}
            className={`w-12 h-6 rounded-full transition-colors ${settings.tax_enabled !== 'false' ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings.tax_enabled !== 'false' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Tax Display */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4">Tax Display</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Prices Display</label>
          <select value={settings.tax_display || 'exclusive'} onChange={(e) => updateSetting('tax_display', e.target.value)} className="input">
            <option value="exclusive">Prices exclude tax (tax added at checkout)</option>
            <option value="inclusive">Prices include tax</option>
          </select>
        </div>
      </div>

      {/* Tax Exemptions */}
      <div>
        <h4 className="font-medium mb-4">Tax Exemptions</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Exempt Category IDs</label>
          <input type="text" value={settings.tax_exempt_categories || ''} onChange={(e) => updateSetting('tax_exempt_categories', e.target.value)} className="input" placeholder="category-id-1,category-id-2" />
          <p className="text-xs text-gray-500 mt-1">Comma-separated category IDs that are tax-exempt</p>
        </div>
      </div>
    </div>
  );
}
