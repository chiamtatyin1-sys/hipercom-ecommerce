import { Shield, Clock, Lock, Users, Key } from 'lucide-react';

export default function SettingsSecurity({ settings, updateSetting }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Security Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure authentication, session, and access control</p>
      </div>

      {/* Session */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Session</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Session Timeout (hours)</label>
            <input type="number" value={settings.session_timeout || '168'} onChange={(e) => updateSetting('session_timeout', e.target.value)} className="input" />
            <p className="text-xs text-gray-500 mt-1">Default: 168 hours (7 days)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Remember Me Duration (days)</label>
            <input type="number" value={settings.remember_me_days || '30'} onChange={(e) => updateSetting('remember_me_days', e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Lock className="h-4 w-4" /> Password Policy</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Password Length</label>
            <input type="number" value={settings.password_min_length || '8'} onChange={(e) => updateSetting('password_min_length', e.target.value)} className="input" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg flex-1">
              <span className="text-sm">Require uppercase</span>
              <button onClick={() => updateSetting('password_require_upper', settings.password_require_upper !== 'false')} className={`w-10 h-5 rounded-full transition-colors ${settings.password_require_upper !== 'false' ? 'bg-primary-600' : 'bg-gray-300'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${settings.password_require_upper !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg flex-1">
              <span className="text-sm">Require numbers</span>
              <button onClick={() => updateSetting('password_require_number', settings.password_require_number !== 'false')} className={`w-10 h-5 rounded-full transition-colors ${settings.password_require_number !== 'false' ? 'bg-primary-600' : 'bg-gray-300'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${settings.password_require_number !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Limits */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Users className="h-4 w-4" /> Login Protection</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Max Login Attempts</label>
            <input type="number" value={settings.max_login_attempts || '5'} onChange={(e) => updateSetting('max_login_attempts', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lockout Duration (minutes)</label>
            <input type="number" value={settings.lockout_duration || '30'} onChange={(e) => updateSetting('lockout_duration', e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2"><Key className="h-4 w-4" /> JWT Secret</h4>
        <div>
          <label className="block text-sm font-medium mb-1">JWT Secret Key</label>
          <input type="password" value={settings.jwt_secret || ''} onChange={(e) => updateSetting('jwt_secret', e.target.value)} className="input font-mono" placeholder="Change this in production" />
          <p className="text-xs text-gray-500 mt-1">⚠️ Changing this will invalidate all existing sessions</p>
        </div>
      </div>
    </div>
  );
}
