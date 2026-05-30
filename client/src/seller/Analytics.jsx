import { useState, useEffect } from 'react';
import { accountingApi } from '../services/api';

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
            <div className="space-y-3">
              {productData.map((p, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span>{p.name}</span>
                  <div className="text-right">
                    <span className="font-bold">RM {p.revenue.toFixed(2)}</span>
                    <span className="text-gray-500 text-sm ml-2">({p.quantity} sold)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Sales by Day</h3>
          {salesData.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sales data yet</p>
          ) : (
            <div className="space-y-2">
              {salesData.slice(-7).map((s, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500">{s.date}</span>
                  <span className="font-medium">RM {s.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}