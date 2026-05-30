import { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Package, ArrowRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminStockTransfer() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: 1,
    notes: '',
  });
  const [availableStock, setAvailableStock] = useState(0);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (form.productId && form.fromWarehouseId) {
      const stock = products.find(p => p.id === form.productId)?.stocks?.find(s => s.warehouseId === form.fromWarehouseId);
      setAvailableStock(stock?.quantity || 0);
    } else {
      setAvailableStock(0);
    }
  }, [form.productId, form.fromWarehouseId, products]);

  const fetchData = async () => {
    try {
      const [tRes, wRes, pRes] = await Promise.all([
        api.get('/stock-transfer'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setTransfers(tRes.data);
      setWarehouses(wRes.data);
      setProducts(pRes.data.products || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fromWarehouseId === form.toWarehouseId) {
      toast.error('Source and destination must be different');
      return;
    }
    if (form.quantity > availableStock) {
      toast.error(`Only ${availableStock} available in source warehouse`);
      return;
    }
    try {
      await api.post('/stock-transfer', form);
      toast.success('Stock transferred successfully');
      setForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: 1, notes: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to transfer stock');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading stock transfers...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ArrowRightLeft className="h-8 w-8" /> Stock Transfer
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Transfer
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Transfer Stock</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product *</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input" required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="input" required />
                {availableStock > 0 && <p className="text-xs text-gray-500 mt-1">Available: {availableStock}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">From Warehouse *</label>
                <select value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })} className="input" required>
                  <option value="">Select source</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Warehouse *</label>
                <select value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })} className="input" required>
                  <option value="">Select destination</option>
                  {warehouses.filter(w => w.id !== form.fromWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Transfer Stock
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Transfer History</h3>
        {transfers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No transfers yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Product</th>
                  <th className="text-left py-2 px-3">From</th>
                  <th className="text-center py-2 px-3">Qty</th>
                  <th className="text-left py-2 px-3">To</th>
                  <th className="text-left py-2 px-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-3 font-medium">{t.product?.name}</td>
                    <td className="py-2 px-3 text-red-600">{t.fromWarehouse?.name}</td>
                    <td className="py-2 px-3 text-center font-bold">{t.quantity}</td>
                    <td className="py-2 px-3 text-green-600">{t.toWarehouse?.name}</td>
                    <td className="py-2 px-3 text-gray-500">{t.notes || '-'}</td>
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
