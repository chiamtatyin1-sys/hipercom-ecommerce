import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Warehouse, CheckCircle, XCircle, MapPin, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', userId: '', isDefault: false, isActive: true });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [whRes, usersRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/users', { params: { role: 'seller' } }),
      ]);
      // Handle both array and object responses
      const whData = Array.isArray(whRes.data) ? whRes.data : (whRes.data.warehouses || []);
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || []);
      setWarehouses(whData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, userId: formData.userId || null };
      if (editingWarehouse) {
        await api.put(`/warehouses/${editingWarehouse.id}`, payload);
        toast.success('Warehouse updated');
      } else {
        await api.post('/warehouses', payload);
        toast.success('Warehouse created');
      }
      setShowModal(false);
      setEditingWarehouse(null);
      setFormData({ name: '', address: '', userId: '', isDefault: false, isActive: true });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save warehouse');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this warehouse?')) {
      try {
        await api.delete(`/warehouses/${id}`);
        toast.success('Warehouse deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const toggleStatus = async (id, field) => {
    const wh = warehouses.find(w => w.id === id);
    if (!wh) return;
    try {
      await api.put(`/warehouses/${id}`, { ...wh, [field]: !wh[field] });
      toast.success(`Warehouse ${field === 'isDefault' ? 'default status' : 'status'} updated`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading warehouses...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Warehouse className="h-6 w-6" /> Warehouses</h2>
        <button onClick={() => { setShowModal(true); setEditingWarehouse(null); setFormData({ name: '', address: '', userId: '', isDefault: false, isActive: true }); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Warehouses</p>
          <p className="text-2xl font-bold">{warehouses.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{warehouses.filter(w => w.isActive).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Default</p>
          <p className="text-2xl font-bold text-blue-600">{warehouses.filter(w => w.isDefault).length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Address</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Assigned To</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Default</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {warehouses.map(w => (
              <tr key={w.id}>
                <td className="px-6 py-4 font-medium">{w.name}</td>
                <td className="px-6 py-4 text-sm">{w.address || '-'}</td>
                <td className="px-6 py-4 text-sm">{w.user?.username || 'Unassigned'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(w.id, 'isDefault')} className={`px-2 py-1 rounded text-xs ${w.isDefault ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {w.isDefault ? 'Yes' : 'No'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(w.id, 'isActive')} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {w.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {w.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 flex space-x-2">
                  <button onClick={() => { setEditingWarehouse(w); setFormData({ name: w.name, address: w.address || '', userId: w.userId || '', isDefault: w.isDefault, isActive: w.isActive }); setShowModal(true); }} className="text-primary-600 hover:text-primary-700"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(w.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {warehouses.length === 0 && (
          <div className="text-center py-12">
            <Warehouse className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No warehouses found</p>
            <button onClick={() => { setShowModal(true); setEditingWarehouse(null); setFormData({ name: '', address: '', userId: '', isDefault: false, isActive: true }); }} className="btn btn-secondary mt-3">
              <Plus className="h-4 w-4" /> Add Your First Warehouse
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setEditingWarehouse(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</h3>
                <p className="text-sm text-gray-500 mt-1">Manage warehouse details and assignments</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditingWarehouse(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Warehouse Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g. Main Warehouse, KL Branch"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input w-full pl-10"
                    placeholder="Full address..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To Seller</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="input w-full pl-10"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
                {users.length === 0 && <p className="text-xs text-gray-500 mt-1">No sellers available. Create a seller user first.</p>}
              </div>

              <div className="flex gap-6 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Default Warehouse</span>
                    <p className="text-xs text-gray-500">Used for new products</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Active</span>
                    <p className="text-xs text-gray-500">Enable warehouse</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingWarehouse(null); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
