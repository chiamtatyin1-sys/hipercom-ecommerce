import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, Copy, Check, X, Clock, Shield } from 'lucide-react';

export default function ApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', permissions: [], expiresAt: '' });
  const [copiedId, setCopiedId] = useState(null);
  const [fullKey, setFullKey] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api-keys');
      setKeys(res.data.keys);
      setPermissions(res.data.permissions);
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKey.name.trim()) {
      toast.error('Key name is required');
      return;
    }
    try {
      const res = await api.post('/api-keys', newKey);
      setFullKey(res.data.key);
      toast.success('API key created! Save it now - it won\'t be shown again.');
      setShowCreate(false);
      setNewKey({ name: '', permissions: [], expiresAt: '' });
      fetchKeys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create API key');
    }
  };

  const revokeKey = async (id) => {
    if (!window.confirm('Revoke this API key? It will no longer work.')) return;
    try {
      await api.post(`/api-keys/${id}/revoke`);
      toast.success('API key revoked');
      fetchKeys();
    } catch (error) {
      toast.error('Failed to revoke API key');
    }
  };

  const deleteKey = async (id) => {
    if (!window.confirm('Delete this API key permanently?')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success('API key deleted');
      fetchKeys();
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const copyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Key copied to clipboard');
    } catch {
      toast.error('Failed to copy key');
    }
  };

  const togglePermission = (permission) => {
    setNewKey(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

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
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-gray-600 mt-1">Manage API keys for external integrations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      {/* Full Key Display Modal */}
      {fullKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-primary-600" />
                Your New API Key
              </h3>
              <button onClick={() => setFullKey(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Save this key now! It will not be shown again.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 p-3 rounded text-sm break-all font-mono">
                  {fullKey}
                </code>
                <button
                  onClick={() => copyKey(fullKey)}
                  className="btn btn-secondary p-2"
                >
                  {copiedId === fullKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setFullKey(null)} className="btn btn-primary">
                I've Saved It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Create API Key</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Key Name</label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mobile App, Partner Integration"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {permissions.map(permission => (
                    <label
                      key={permission}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                        newKey.permissions.includes(permission)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newKey.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="h-4 w-4 text-primary-600"
                      />
                      <span className="text-sm">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expires At (optional)</label>
                <input
                  type="date"
                  value={newKey.expiresAt}
                  onChange={(e) => setNewKey(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={createKey} className="btn btn-primary">
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="card overflow-hidden">
        {keys.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No API keys yet</p>
            <p className="text-sm mt-1">Create your first API key to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {keys.map(key => (
                <tr key={key.id} className={isExpired(key.expiresAt) ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{key.name}</div>
                    <div className="text-xs text-gray-500">Created {formatDate(key.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{key.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(key.permissions || '[]').map(p => (
                        <span key={p} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                      {JSON.parse(key.permissions || '[]').length === 0 && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {key.isActive ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Revoked</span>
                    )}
                    {isExpired(key.expiresAt) && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full ml-1">Expired</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => revokeKey(key.id)}
                        disabled={!key.isActive}
                        className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50"
                        title="Revoke"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
