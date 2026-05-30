import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, MapPin, Home } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ProfileAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', country: 'MY', isDefault: false });

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, formData);
        toast.success('Address updated');
      } else {
        await api.post('/addresses', formData);
        toast.success('Address added');
      }
      setShowModal(false);
      setEditingAddress(null);
      setFormData({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', country: 'MY', isDefault: false });
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this address?')) {
      try {
        await api.delete(`/addresses/${id}`);
        toast.success('Address deleted');
        fetchAddresses();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const setDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}`, { isDefault: true });
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading addresses...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6" /> My Addresses</h2>
        <button onClick={() => { setShowModal(true); setEditingAddress(null); setFormData({ name: user?.username || '', phone: user?.phone || '', address: '', city: '', state: '', postalCode: '', country: 'MY', isDefault: false }); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(addr => (
          <div key={addr.id} className={`card p-4 ${addr.isDefault ? 'border-2 border-primary-500' : ''}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium">{addr.name}</h3>
              </div>
              {addr.isDefault && <span className="badge badge-primary">Default</span>}
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>{addr.address}</p>
              <p>{addr.city}, {addr.state} {addr.postalCode}</p>
              <p>{addr.country}</p>
              <p>Phone: {addr.phone}</p>
            </div>
            <div className="flex gap-2">
              {!addr.isDefault && <button onClick={() => setDefault(addr.id)} className="btn btn-secondary px-3 py-1 text-sm">Set Default</button>}
              <button onClick={() => { setEditingAddress(addr); setFormData({ name: addr.name, phone: addr.phone, address: addr.address, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country, isDefault: addr.isDefault }); setShowModal(true); }} className="btn btn-secondary px-3 py-1 text-sm flex items-center gap-1"><Edit className="h-3 w-3" /> Edit</button>
              <button onClick={() => handleDelete(addr.id)} className="btn bg-red-600 text-white px-3 py-1 text-sm flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {addresses.length === 0 && (
        <div className="card p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No addresses saved yet</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">Add Your First Address</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
              <button onClick={() => { setShowModal(false); setEditingAddress(null); }}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Street Address *</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code *</label>
                  <input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="input">
                  <option value="MY">Malaysia</option>
                  <option value="SG">Singapore</option>
                  <option value="TH">Thailand</option>
                </select>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} /> Set as default address</label>
              <button type="submit" className="btn btn-primary w-full">{editingAddress ? 'Update' : 'Save'} Address</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
