import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.put(`/users/${user.id}`, formData);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="card p-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-primary-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold">{user.username}</h2>
            <p className="text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="input bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Referral Code</label>
            <input
              type="text"
              value={user.referralCode || ''}
              disabled
              className="input bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Share this code to earn rewards!</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {user.role === 'seller' && (
        <div className="card p-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">Seller Dashboard</h3>
          <p className="text-gray-600 mb-4">Manage your products, orders, and analytics.</p>
          <Link to="/seller" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="card p-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">Admin Dashboard</h3>
          <p className="text-gray-600 mb-4">Manage users, products, orders, and accounting.</p>
          <Link to="/admin" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      )}
    </div>
  );
}