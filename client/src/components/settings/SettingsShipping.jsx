import { Truck, MapPin, DollarSign } from 'lucide-react';

export default function SettingsShipping({ settings, updateSetting }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Shipping Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure shipping rates, zones, and delivery options</p>
      </div>

      {/* Shipping Rates */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Truck className="h-4 w-4" /> Shipping Rates</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Flat Shipping Rate (RM)</label>
            <input type="number" step="0.01" value={settings.shipping_flat_rate || '5'} onChange={(e) => updateSetting('shipping_flat_rate', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Free Shipping Threshold (RM)</label>
            <input type="number" step="0.01" value={settings.shipping_free_threshold || '100'} onChange={(e) => updateSetting('shipping_free_threshold', e.target.value)} className="input" />
            <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
          </div>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery Zones</h4>
        <div className="space-y-3">
          {[
            { key: 'zone_west_my', label: 'West Malaysia', default: '5' },
            { key: 'zone_east_my', label: 'East Malaysia', default: '15' },
            { key: 'zone_international', label: 'International', default: '50' },
          ].map(zone => (
            <div key={zone.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-sm">{zone.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">RM</span>
                <input type="number" step="0.01" value={settings[zone.key] || zone.default} onChange={(e) => updateSetting(zone.key, e.target.value)} className="input w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4">Delivery Settings</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Delivery Days (West MY)</label>
            <input type="number" value={settings.delivery_days_west || '3-5'} onChange={(e) => updateSetting('delivery_days_west', e.target.value)} className="input" placeholder="3-5" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Delivery Days (East MY)</label>
            <input type="number" value={settings.delivery_days_east || '5-7'} onChange={(e) => updateSetting('delivery_days_east', e.target.value)} className="input" placeholder="5-7" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Courier</label>
            <input type="text" value={settings.default_courier || 'Pos Laju'} onChange={(e) => updateSetting('default_courier', e.target.value)} className="input" placeholder="Pos Laju" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tracking URL Pattern</label>
            <input type="text" value={settings.tracking_url || 'https://www.pos.com.my/track/{tracking}'} onChange={(e) => updateSetting('tracking_url', e.target.value)} className="input" placeholder="https://.../{tracking}" />
            <p className="text-xs text-gray-500 mt-1">Use {'{tracking}'} as placeholder</p>
          </div>
        </div>
      </div>

      {/* Pickup Settings */}
      <div>
        <h4 className="font-medium mb-4">Self Pickup</h4>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm">Enable Self Pickup</p>
            <p className="text-xs text-gray-500">Allow customers to pick up orders at branches</p>
          </div>
          <button
            onClick={() => updateSetting('pickup_enabled', settings.pickup_enabled !== 'false')}
            className={`w-12 h-6 rounded-full transition-colors ${settings.pickup_enabled !== 'false' ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings.pickup_enabled !== 'false' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
