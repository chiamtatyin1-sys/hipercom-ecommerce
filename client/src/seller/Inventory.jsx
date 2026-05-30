import { useState, useEffect } from 'react';
import { Plus, X, Package, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SellerInventory() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', isDefault: false });
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [whRes, invRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/accounting/reports/inventory')
      ]);
      setWarehouses(whRes.data);
      setLowStockProducts(invRes.data?.lowStockProducts || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/warehouses', formData);
      toast.success('Warehouse added!');
      setShowModal(false);
      setFormData({ name: '', address: '', isDefault: false });
      fetchData();
    } catch (error) {
      toast.error('Failed to add warehouse');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading inventory...</span>
    </div>
  );

  const totalStock = warehouses.reduce((sum, wh) => sum + (wh._count?.products || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventory & Warehouses</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />Add Warehouse
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-gray-500 text-sm">Total Warehouses</p>
          <p className="text-2xl font-bold">{warehouses.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-500 text-sm">Total Products</p>
          <p className="text-2xl font-bold">{totalStock}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-500 text-sm">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map((p, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="text-orange-600">Stock: {p.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warehouses */}
      <h3 className="text-lg font-semibold mb-4">Warehouses</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map(wh => (
          <div key={wh.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <Package className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{wh.name}</h4>
                  <p className="text-sm text-gray-500">{wh.address || 'No address'}</p>
                </div>
              </div>
              {wh.isDefault && (
                <span className="badge badge-info">Default</span>
              )}
            </div>
            <div className="mt-3 text-sm text-gray-500">
              {wh._count?.products || 0} products
            </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg">No warehouses yet</p>
            <p className="text-sm mt-1">Click "Add Warehouse" to create your first warehouse</p>
          </div>
        )}
      </div>

      {/* Add Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Warehouse</h3>
              <button onClick={() => setShowModal(false)}><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Warehouse Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm">Set as default warehouse</label>
              </div>
              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? 'Saving...' : 'Add Warehouse'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}