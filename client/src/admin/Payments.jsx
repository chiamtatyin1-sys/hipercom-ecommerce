import { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { paymentsApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPayments() {
  const [view, setView] = useState('payments'); // payments | refunds
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [refundPage, setRefundPage] = useState(1);
  const [refundTotal, setRefundTotal] = useState(0);

  useEffect(() => {
    if (view === 'payments') fetchPayments();
    else fetchRefunds();
  }, [view, filter, refundPage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const res = await paymentsApi.getAll(params);
      setPayments(res.data.payments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getRefunds({ page: refundPage, limit: 10 });
      setRefunds(res.data.refunds || []);
      setRefundTotal(res.data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredPayments = payments.filter(p =>
    !search || p.order?.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading payments...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" /> Payments & Refunds</h2>
        <div className="flex gap-2">
          <button onClick={() => setView('payments')} className={`btn ${view === 'payments' ? 'btn-primary' : 'btn-secondary'}`}>Payments</button>
          <button onClick={() => setView('refunds')} className={`btn ${view === 'refunds' ? 'btn-primary' : 'btn-secondary'}`}>Refunds</button>
        </div>
      </div>

      {view === 'payments' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-green-600">RM {totalPaid.toFixed(2)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">RM {totalPending.toFixed(2)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Failed/Refunded</p>
              <p className="text-2xl font-bold text-red-600">{payments.filter(p => ['failed', 'refunded'].includes(p.status)).length}</p>
            </div>
          </div>

          <div className="card p-4 mb-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number..." className="input pl-10" />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input py-2">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Method</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{p.order?.orderNumber || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold">RM {p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm capitalize">{p.method || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${getStatusBadge(p.status)}`}>
                        {getStatusIcon(p.status)} {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && <p className="text-gray-500 text-center py-8">No payments found</p>}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-sm text-gray-500">Total Refunds</p>
              <p className="text-2xl font-bold">{refundTotal}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Refunded Amount</p>
              <p className="text-2xl font-bold text-blue-600">RM {refunds.reduce((sum, r) => sum + Math.abs(r.amount), 0).toFixed(2)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-lg font-medium">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Refund Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">HitPay ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {refunds.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{r.order?.orderNumber || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-red-600">-RM {Math.abs(r.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{r.notes || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-mono">{r.hitpayRefundId || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {refunds.length === 0 && <p className="text-gray-500 text-center py-8">No refunds found</p>}
            <div className="flex justify-between items-center p-4 border-t">
              <p className="text-sm text-gray-500">Page {refundPage}</p>
              <div className="flex gap-2">
                <button onClick={() => setRefundPage(p => Math.max(1, p - 1))} disabled={refundPage === 1} className="btn btn-secondary flex items-center gap-1 disabled:opacity-50">
                  <ArrowLeft className="h-4 w-4" /> Prev
                </button>
                <button onClick={() => setRefundPage(p => p + 1)} disabled={refunds.length < 10} className="btn btn-secondary flex items-center gap-1 disabled:opacity-50">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
