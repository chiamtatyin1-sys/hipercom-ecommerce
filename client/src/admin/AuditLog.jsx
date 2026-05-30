import { useState, useEffect } from 'react';
import { Shield, Filter, Clock, User, FileText } from 'lucide-react';
import api from '../services/api';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => { fetchLogs(); fetchStats(); }, [page, filterEntity, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filterEntity) params.entity = filterEntity;
      if (filterAction) params.action = filterAction;
      const res = await api.get('/audit', { params });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/audit/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'delete': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && !logs.length) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading audit logs...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Audit Log</h2>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold">{stats.totalLogs}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Entities Tracked</p>
            <p className="text-2xl font-bold">{stats.entityBreakdown?.length || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Action Types</p>
            <p className="text-2xl font-bold">{stats.actionBreakdown?.length || 0}</p>
          </div>
        </div>
      )}

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }} className="input py-1 text-sm">
            <option value="">All Entities</option>
            {stats?.entityBreakdown?.map(e => <option key={e.entity} value={e.entity}>{e.entity} ({e._count})</option>)}
          </select>
          <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} className="input py-1 text-sm">
            <option value="">All Actions</option>
            {stats?.actionBreakdown?.map(a => <option key={a.action} value={a.action}>{a.action} ({a._count})</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Timestamp</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Action</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Entity</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" />{new Date(log.createdAt).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{log.entity}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">{log.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-gray-500 text-center py-8">No audit logs found</p>}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary">Previous</button>
          <span className="px-4 py-2">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn btn-secondary">Next</button>
        </div>
      )}
    </div>
  );
}
