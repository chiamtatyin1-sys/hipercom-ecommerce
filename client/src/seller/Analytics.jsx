import { useState, useEffect } from 'react';
import { accountingApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function SellerAnalytics() {
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sales, products] = await Promise.all([
        accountingApi.getSalesReport({ groupBy: 'day' }),
        accountingApi.getProductsReport({ limit: 10 }),
      ]);
      setSalesData(sales.data);
      setProductData(products.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading analytics...</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>
      <div className="grid gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Top Products</h3>
          {productData.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `RM ${v}`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `RM ${Number(value).toFixed(2)}`} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Sales by Day</h3>
          {salesData.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData.slice(-14)} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `RM ${v}`} />
                <Tooltip formatter={(value) => `RM ${Number(value).toFixed(2)}`} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
