import { useState, useEffect } from 'react';
import { Server, Database, HardDrive, Activity, RefreshCw, Shield, Clock, MemoryStick } from 'lucide-react';
import api from '../services/api';

export default function AdminMonitoring() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, metricsRes, backupsRes] = await Promise.all([
        api.get('/monitoring/health'),
        api.get('/monitoring/stats'),
        api.get('/monitoring/backups'),
      ]);
      setHealth(healthRes.data);
      setMetrics(metricsRes.data);
      setBackups(backupsRes.data.backups || []);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  if (loading && !health) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading monitoring data...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6" /> System Monitoring</h2>
        <button onClick={fetchData} className="btn btn-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">Last updated: {lastRefresh.toLocaleTimeString()}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Server Status</p>
              <p className="text-lg font-bold text-green-600">Online</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Database</p>
              <p className="text-lg font-bold text-blue-600">Connected</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="text-lg font-bold">{health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">DB Size</p>
              <p className="text-lg font-bold">{health?.database?.size ? `${(health.database.size / 1024).toFixed(1)} KB` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {health && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><MemoryStick className="h-5 w-5" /> System Resources</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span className="font-medium">{health.system?.memory?.usagePercent ? `${health.system.memory.usagePercent}%` : 'N/A'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: health.system?.memory?.usagePercent ? `${health.system.memory.usagePercent}%` : '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Node Heap</span>
                  <span className="font-medium">{health.performance?.memoryUsage?.heapUsed ? `${(health.performance.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: health.performance?.memoryUsage?.heapUsed ? `${Math.min((health.performance.memoryUsage.heapUsed / health.performance.memoryUsage.heapTotal) * 100, 100)}%` : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Shield className="h-5 w-5" /> Security</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">Rate Limiting</span>
                <span className="badge badge-success">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">JWT Authentication</span>
                <span className="badge badge-success">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">CORS Protection</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><HardDrive className="h-5 w-5" /> Recent Backups</h3>
        {backups.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No backups found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Filename</th>
                  <th className="text-left py-2">Size</th>
                  <th className="text-left py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {backups.slice(0, 10).map((backup, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs">{backup.name}</td>
                    <td className="py-2">{backup.size ? `${(backup.size / 1024).toFixed(1)} KB` : 'N/A'}</td>
                    <td className="py-2 text-gray-500">{new Date(backup.created).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
