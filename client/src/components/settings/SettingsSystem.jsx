import { Database, Download, AlertTriangle, Info, RefreshCw, Power } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SettingsSystem({ settings, updateSetting }) {
  const [backupRunning, setBackupRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  const handleBackup = async () => {
    setBackupRunning(true);
    try {
      const res = await api.post('/ai/backup', { mode: 'manual' });
      toast.success('Backup created!');
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setBackupRunning(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await api.get('/monitoring/health');
      setSystemInfo(res.data);
    } catch (error) {
      toast.error('Failed to fetch system info');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">System Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Database backup, API keys, system info, and maintenance mode</p>
      </div>

      {/* Maintenance Mode */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Power className="h-4 w-4" /> Maintenance Mode</h4>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Maintenance Mode
            </p>
            <p className="text-xs text-gray-500">Show maintenance page to customers</p>
          </div>
          <button
            onClick={() => updateSetting('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
            className={`w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode === 'true' ? 'bg-red-600' : 'bg-gray-300'}`}
          >
            <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Database Backup */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Database className="h-4 w-4" /> Database Backup</h4>
        <div className="flex gap-3">
          <button onClick={handleBackup} disabled={backupRunning} className="btn btn-primary flex items-center gap-2">
            <Download className="h-4 w-4" /> {backupRunning ? 'Backing up...' : 'Create Backup'}
          </button>
          <button onClick={fetchSystemInfo} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh Status
          </button>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Database</p>
            <p className="font-medium">PostgreSQL 15</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Node.js</p>
            <p className="font-medium">v20 LTS</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Environment</p>
            <p className="font-medium">{settings.NODE_ENV || 'production'}</p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Info className="h-4 w-4" /> System Information</h4>
        {systemInfo ? (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Server Time</p>
              <p className="font-medium">{new Date(systemInfo.timestamp).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-medium text-green-600">Healthy</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Click "Refresh Status" to load system info</p>
        )}
      </div>

      {/* API Keys */}
      <div>
        <h4 className="font-medium mb-4">External API Keys</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">OpenRouter API Key</label>
            <input type="password" value={settings.OPENROUTER_API_KEY || ''} onChange={(e) => updateSetting('OPENROUTER_API_KEY', e.target.value)} className="input font-mono" placeholder="sk-or-v1-..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NVIDIA API Key</label>
            <input type="password" value={settings.NVIDIA_API_KEY || ''} onChange={(e) => updateSetting('NVIDIA_API_KEY', e.target.value)} className="input font-mono" placeholder="nvapi-..." />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">⚠️ These are also stored in .env. Changes here override .env values at runtime.</p>
      </div>
    </div>
  );
}
