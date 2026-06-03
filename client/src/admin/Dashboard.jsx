import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [prevData, setPrevData] = useState(null);

  useEffect(() => { fetchAnalytics(); }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const prevEnd = new Date(startDate);
      const prevStart = new Date();
      prevStart.setDate(prevStart.getDate() - days * 2);
      const [currRes, prevRes] = await Promise.all([
        api.get(`/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/analytics?startDate=${prevStart.toISOString()}&endDate=${prevEnd.toISOString()}`),
      ]);
      setData(currRes.data);
      setPrevData(prevRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading analytics...</span>
    </div>
  );
  if (!data) return (
    <div className="text-center py-16">
      <p className="text-lg text-gray-500">Failed to load analytics</p>
      <button onClick={fetchAnalytics} className="btn btn-primary mt-4">Retry</button>
    </div>
  );

  const { summary, statusCounts, revenueTrend, topProducts, couponUsage, recentOrders } = data;
  const prevSummary = prevData?.summary || {};

  const revenueGrowth = getGrowth(summary?.totalRevenue || 0, prevSummary.totalRevenue || 0);
  const ordersGrowth = getGrowth(summary?.totalOrders || 0, prevSummary.totalOrders || 0);
  const avgGrowth = getGrowth(summary?.avgOrderValue || 0, prevSummary.avgOrderValue || 0);
  const monthlyGrowth = getGrowth(summary?.monthlyRevenue || 0, prevSummary.monthlyRevenue || 0);

  const chartData = (revenueTrend || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders || 0,
  }));

  const statusData = Object.entries(statusCounts || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales Dashboard</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input py-1 text-sm">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `RM ${summary.totalRevenue.toFixed(2)}`, growth: revenueGrowth, icon: DollarSign, color: 'green', textColor: 'text-green-600', iconColor: 'text-green-500' },
          { label: 'Total Orders', value: summary.totalOrders, growth: ordersGrowth, icon: ShoppingCart, color: 'blue', textColor: 'text-blue-600', iconColor: 'text-blue-500' },
          { label: 'Avg Order Value', value: `RM ${summary.avgOrderValue.toFixed(2)}`, growth: avgGrowth, icon: TrendingUp, color: 'purple', textColor: 'text-purple-600', iconColor: 'text-purple-500' },
          { label: 'This Month', value: `RM ${summary.monthlyRevenue.toFixed(2)}`, growth: monthlyGrowth, icon: Package, color: 'orange', textColor: 'text-orange-600', iconColor: 'text-orange-500' },
        ].map((card, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {card.growth >= 0 ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                  <span className={`text-xs font-medium ${card.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(card.growth).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">vs prev</span>
                </div>
              </div>
              <card.icon className={`h-10 w-10 ${card.iconColor} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-lg mb-4">Revenue & Orders Trend</h3>
          {chartData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (RM)" />
                <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" radius={[4, 4, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Order Status</h3>
          {statusData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusData.map((status, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{status.name}</span>
                    </div>
                    <span className="font-medium">{status.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (RM)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Coupon Performance</h3>
          {couponUsage.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No coupon usage yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={couponUsage.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="totalDiscount" fill="#ef4444" name="Discount (RM)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Order #</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Items</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Payment</th>
                  <th className="text-right py-2 px-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{order.orderNumber}</td>
                    <td className="py-2 px-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-3">{order.itemCount}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold">RM {order.total.toFixed(2)}</td>
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
