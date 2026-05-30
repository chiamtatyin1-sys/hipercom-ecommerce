import { useState, useEffect } from 'react';
import { Package, ShoppingCart, DollarSign, Users, TrendingUp } from 'lucide-react';
import { accountingApi } from '../services/api';

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await accountingApi.getDashboard();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading dashboard...</span>
    </div>
  );

  if (!stats) return (
    <div className="text-center py-16">
      <p className="text-lg text-gray-500">Failed to load dashboard data</p>
      <button onClick={fetchDashboard} className="btn btn-primary mt-4">Retry</button>
    </div>
  );

  const cards = [
    { title: "Today's Sales", value: `RM ${stats?.todaySales?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { title: 'This Week', value: `RM ${stats?.weekSales?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
    { title: 'This Month', value: `RM ${stats?.monthSales?.toFixed(2) || '0.00'}`, icon: Package, color: 'bg-purple-100 text-purple-600' },
    { title: 'Total Orders', value: stats?.orderCount?.today || 0, icon: ShoppingCart, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="card p-6">
            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
              <card.icon className="h-6 w-6" />
            </div>
            <p className="text-gray-500 text-sm">{card.title}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Transactions</h3>
          {stats?.recentTransactions?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTransactions.slice(0, 5).map((t, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{t.category}</p>
                    <p className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}RM {t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent transactions</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Low Stock Alerts</h3>
          {stats?.lowStockProducts?.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-red-600 text-sm">Stock: {p.stock}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">All products are well stocked</p>
          )}
        </div>
      </div>
    </div>
  );
}