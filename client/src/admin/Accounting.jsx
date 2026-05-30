import { useState, useEffect } from 'react';
import { accountingApi } from '../services/api';

export default function AdminAccounting() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [transRes, dashRes] = await Promise.all([
        accountingApi.getTransactions({ limit: 50 }),
        accountingApi.getDashboard(),
      ]);
      setTransactions(transRes.data.transactions);
      setSummary({ totalRevenue: dashRes.data.totalRevenue, totalExpenses: dashRes.data.totalExpenses, profit: dashRes.data.profit });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading accounting...</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Accounting</h2>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">RM {(summary.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="card p-6">
          <p className="text-gray-500">Total Expenses</p>
          <p className="text-3xl font-bold text-red-600">RM {(summary.totalExpenses || 0).toFixed(2)}</p>
        </div>
        <div className="card p-6">
          <p className="text-gray-500">Net Profit</p>
          <p className="text-3xl font-bold text-primary-600">RM {(summary.profit || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(t => (
              <div key={t.id} className="flex justify-between py-3 border-b">
                <div>
                  <p className="font-medium capitalize">{t.category}</p>
                  <p className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}RM {t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}