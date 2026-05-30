import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Gift, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Package } from 'lucide-react';

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, [page]);

  const fetchBalance = async () => {
    try {
      const res = await api.get('/loyalty/balance');
      setBalance(res.data);
    } catch (error) {
      toast.error('Failed to load loyalty balance');
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loyalty/history', { params: { page, limit: 20 } });
      setHistory(res.data.transactions);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points <= 0) {
      toast.error('Enter a valid points amount');
      return;
    }
    if (points > (balance?.balance || 0)) {
      toast.error('Insufficient points');
      return;
    }

    setRedeeming(true);
    try {
      const res = await api.post('/loyalty/redeem', { points });
      toast.success(`Redeemed ${points} points for RM ${res.data.discount.toFixed(2)} discount!`);
      setRedeemAmount('');
      fetchBalance();
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to redeem points');
    } finally {
      setRedeeming(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!balance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Loyalty Points</h1>

      {/* Balance Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">Your Points Balance</p>
            <p className="text-4xl font-bold mt-2">{balance.balance}</p>
            <p className="text-primary-100 text-sm mt-1">points</p>
          </div>
          <Gift className="h-16 w-16 text-primary-200" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary-500">
          <div>
            <p className="text-primary-100 text-xs">Total Earned</p>
            <p className="text-xl font-semibold">{balance.totalEarned}</p>
          </div>
          <div>
            <p className="text-primary-100 text-xs">Total Redeemed</p>
            <p className="text-xl font-semibold">{balance.totalRedeemed}</p>
          </div>
          <div>
            <p className="text-primary-100 text-xs">Value</p>
            <p className="text-xl font-semibold">RM {(balance.balance / balance.redeemRate).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Redeem Section */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Redeem Points</h3>
        <p className="text-sm text-gray-600 mb-4">
          {balance.pointsPerRM} point = RM {(1 / balance.redeemRate).toFixed(2)} | Minimum redemption: {balance.redeemRate} points
        </p>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              placeholder={`Enter points (min ${balance.redeemRate})`}
              className="input"
              min={balance.redeemRate}
              max={balance.balance}
            />
          </div>
          <button
            onClick={handleRedeem}
            disabled={redeeming || !redeemAmount || parseInt(redeemAmount) < balance.redeemRate}
            className="btn btn-primary disabled:opacity-50"
          >
            {redeeming ? 'Redeeming...' : 'Redeem'}
          </button>
        </div>
        {redeemAmount && parseInt(redeemAmount) >= balance.redeemRate && (
          <p className="text-sm text-green-600 mt-2">
            You'll get RM {(parseInt(redeemAmount) / balance.redeemRate).toFixed(2)} discount
          </p>
        )}
      </div>

      {/* Transaction History */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-lg p-4 border-b">Transaction History</h3>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Gift className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {history.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'earn' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'earn' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      {tx.order && (
                        <p className="text-xs text-gray-500">
                          Order: {tx.order.orderNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'earn' ? '+' : ''}{tx.points} pts
                    </p>
                    <p className="text-xs text-gray-400">{formatTime(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-600">
                  {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} of {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary p-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">Page {page}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary p-2 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
