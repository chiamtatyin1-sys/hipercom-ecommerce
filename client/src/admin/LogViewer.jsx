import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Trash2, RefreshCw, AlertTriangle, Info, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const LEVEL_COLORS = {
  DEBUG: 'text-gray-500',
  INFO: 'text-green-600',
  WARN: 'text-yellow-600',
  ERROR: 'text-red-600',
  FATAL: 'text-purple-600',
};

const LEVEL_ICONS = {
  DEBUG: Info,
  INFO: Info,
  WARN: AlertTriangle,
  ERROR: AlertCircle,
  FATAL: AlertCircle,
};

export default function LogViewer() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, [page, levelFilter, filter]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/logs/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (levelFilter) params.level = levelFilter;
      if (filter) params.search = filter;

      const res = await api.get('/logs', { params });
      setLogs(res.data.logs);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Clear all logs? This cannot be undone.')) return;
    try {
      await api.post('/logs/clear');
      toast.success('Logs cleared');
      fetchStats();
      fetchLogs();
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Log Viewer</h1>
          <p className="text-gray-600 mt-1">Monitor application logs and errors</p>
        </div>
        <button
          onClick={clearLogs}
          className="btn btn-danger flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Logs
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-2xl font-bold">{stats.infoCount || 0}</div>
          <div className="text-sm text-green-600">Info</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold">{stats.warnCount || 0}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold">{stats.errorCount || 0}</div>
          <div className="text-sm text-red-600">Errors</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold">{stats.fileCount || 0}</div>
          <div className="text-sm text-gray-600">Log Files</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold">{formatSize(stats.totalSize || 0)}</div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                placeholder="Search logs..."
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">All Levels</option>
            <option value="DEBUG">Debug</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
            <option value="FATAL">Fatal</option>
          </select>
          <button
            onClick={() => { setFilter(''); setLevelFilter(''); setPage(1); }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No logs found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log, index) => {
                    const Icon = LEVEL_ICONS[log.level] || Info;
                    return (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setSelectedLog(log); setShowDetail(true); }}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${LEVEL_COLORS[log.level]} bg-opacity-10`}>
                            <Icon className="h-3 w-3" />
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                          {log.message}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {log.request ? `${log.request.method} ${log.request.url}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} logs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log Detail Modal */}
      {showDetail && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Log Details</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="text-sm">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Level</label>
                  <p className={`text-sm font-medium ${LEVEL_COLORS[selectedLog.level]}`}>{selectedLog.level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Message</label>
                  <p className="text-sm">{selectedLog.message}</p>
                </div>
                {selectedLog.request && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Request</label>
                    <pre className="text-sm bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(selectedLog.request, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.response && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Response</label>
                    <pre className="text-sm bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(selectedLog.response, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.error && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Error</label>
                    <pre className="text-sm bg-red-50 text-red-700 p-2 rounded mt-1 overflow-x-auto">
                      {selectedLog.error.stack || selectedLog.error.message}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
