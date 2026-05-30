import { useState } from 'react';
import { BarChart3, Download, FileText, Package, Users, DollarSign, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDates = () => {
    if (dateRange === 'custom' && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  const exportCSV = async (type) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDates();
      let data, filename, headers;

      switch (type) {
        case 'sales':
          const salesRes = await api.get(`/analytics?startDate=${startDate}&endDate=${endDate}`);
          const salesData = salesRes.data;
          const salesRows = [
            ['Metric', 'Value'],
            ['Total Revenue', `RM ${salesData.summary.totalRevenue.toFixed(2)}`],
            ['Total Orders', salesData.summary.totalOrders],
            ['Average Order Value', `RM ${salesData.summary.avgOrderValue.toFixed(2)}`],
            ['Monthly Revenue', `RM ${salesData.summary.monthlyRevenue.toFixed(2)}`],
            ['Conversion Rate', `${salesData.summary.conversionRate}%`],
            [],
            ['Revenue Trend'],
            ['Date', 'Revenue'],
            ...salesData.revenueTrend.map(r => [r.date, `RM ${r.revenue.toFixed(2)}`]),
            [],
            ['Top Products'],
            ['Product', 'Quantity', 'Revenue'],
            ...salesData.topProducts.map(p => [p.name, p.quantity, `RM ${p.revenue.toFixed(2)}`]),
          ];
          data = salesRows.map(r => r.join(',')).join('\n');
          filename = `sales-report-${startDate}-${endDate}.csv`;
          break;

        case 'inventory':
          const productsRes = await api.get('/products?page=1&limit=1000');
          const products = productsRes.data.products || [];
          const invRows = [
            ['SKU', 'Name', 'Price', 'Cost', 'Stock', 'Low Stock Alert', 'Category', 'Brand', 'Status'],
            ...products.map(p => [
              p.sku, p.name, p.price, p.costPrice, p.stock, p.lowStockAlert,
              p.category?.name || '', p.brand?.name || '', p.isActive ? 'Active' : 'Inactive'
            ]),
          ];
          data = invRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
          filename = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'customers':
          const customersRes = await api.get('/customers?page=1&limit=1000');
          const customers = customersRes.data.customers || [];
          const custRows = [
            ['Username', 'Email', 'Phone', 'Role', 'Orders', 'Total Spent', 'Wallet', 'Joined', 'Status'],
            ...customers.map(c => [
              c.username, c.email, c.phone || '', c.role, c.orderCount || 0,
              `RM ${(c.totalSpent || 0).toFixed(2)}`, `RM ${(c.wallet || 0).toFixed(2)}`,
              new Date(c.createdAt).toLocaleDateString(), c.isActive ? 'Active' : 'Inactive'
            ]),
          ];
          data = custRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
          filename = `customers-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'orders':
          const ordersRes = await api.get(`/orders?page=1&limit=1000`);
          const orders = ordersRes.data.orders || [];
          const orderRows = [
            ['Order #', 'Date', 'Customer', 'Email', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Status', 'Payment'],
            ...orders.map(o => [
              o.orderNumber, new Date(o.createdAt).toLocaleDateString(),
              o.user?.username || '', o.user?.email || '',
              o.items?.length || 0, o.subtotal, o.discount + o.referralDiscount,
              o.tax, o.total, o.status, o.paymentStatus
            ]),
          ];
          data = orderRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
          filename = `orders-report-${startDate}-${endDate}.csv`;
          break;
      }

      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filename} downloaded!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" /> Reports & Export
        </h2>
      </div>

      {/* Date Range */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Calendar className="h-5 w-5" /> Date Range</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
            { value: '365', label: 'Last year' },
            { value: 'custom', label: 'Custom' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setDateRange(opt.value)} className={`px-4 py-2 rounded-lg text-sm ${dateRange === opt.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input" />
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: 'sales', icon: DollarSign, label: 'Sales Report', desc: 'Revenue, orders, top products', color: 'green' },
          { type: 'inventory', icon: Package, label: 'Inventory Report', desc: 'Products, stock, pricing', color: 'blue' },
          { type: 'customers', icon: Users, label: 'Customers Report', desc: 'User data, spending, orders', color: 'purple' },
          { type: 'orders', icon: FileText, label: 'Orders Report', desc: 'All orders with details', color: 'orange' },
        ].map(report => {
          const Icon = report.icon;
          return (
            <div key={report.type} className="card p-6">
              <div className={`w-12 h-12 rounded-lg bg-${report.color}-100 flex items-center justify-center mb-4`}>
                <Icon className={`h-6 w-6 text-${report.color}-600`} />
              </div>
              <h4 className="font-semibold">{report.label}</h4>
              <p className="text-sm text-gray-500 mb-4">{report.desc}</p>
              <button onClick={() => exportCSV(report.type)} disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> {loading ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
