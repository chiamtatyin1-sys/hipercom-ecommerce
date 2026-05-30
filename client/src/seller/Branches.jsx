import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, MapPin } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SellerBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    isDefault: false,
  });

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/warehouses', { params: { userId: 'me' } });
      setBranches(res.data || []);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBranch) {
        await api.put(`/warehouses/${editingBranch.id}`, formData);
        toast.success('Branch updated!');
      } else {
        await api.post('/warehouses', formData);
        toast.success('Branch added!');
      }
      setShowModal(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', isDefault: false });
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      isDefault: branch.isDefault || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this branch?')) return;
    try {
      await api.delete(`/warehouses/${id}`);
      toast.success('Branch deleted!');
      fetchBranches();
    } catch (error) {
      toast.error('Failed to delete branch');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBranch(null);
    setFormData({ name: '', address: '', isDefault: false });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading branches...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Branches</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />Add Branch
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(branch => (
          <div key={branch.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{branch.name}</h3>
                {branch.isDefault && (
                  <span className="badge badge-success text-xs">Default</span>
                )}
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(branch)} className="text-primary-600 hover:text-primary-700">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(branch.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-start text-gray-600">
              <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{branch.address || 'No address provided'}</p>
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No branches yet. Add your first branch!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Branch Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input h-24"
                  placeholder="Full address..."
                  required
                />
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Set as default branch</span>
              </label>

              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? 'Saving...' : editingBranch ? 'Update Branch' : 'Add Branch'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
