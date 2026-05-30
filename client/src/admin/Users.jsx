import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    role: 'customer',
    password: '',
    isActive: true,
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { limit: 50 } });
      setUsers(res.data.users);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        // Update user
        await api.put(`/users/${editingUser.id}`, {
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.isActive,
        });
        toast.success('User updated!');
      } else {
        // Create user
        if (!formData.password) {
          toast.error('Password is required for new user');
          setSaving(false);
          return;
        }
        await api.post('/auth/register', {
          ...formData,
          referralCode: '',
        });
        toast.success('User created!');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', phone: '', role: 'customer', password: '', isActive: true });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deactivated!');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ username: '', email: '', phone: '', role: 'customer', password: '', isActive: true });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading users...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Username</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4">{u.username}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">{u.phone || '-'}</td>
                <td className="px-6 py-4"><span className="badge badge-info">{u.role}</span></td>
                <td className="px-6 py-4">
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(u)} className="text-primary-600 hover:text-primary-700">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No users found</p>
            <p className="text-sm mt-1">Click "Add User" to create the first user</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  required
                  disabled={editingUser}
                  placeholder="Username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+60..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password {editingUser ? '(leave blank to keep)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Minimum 6 characters'}
                  {...(!editingUser && { required: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Active</span>
              </label>

              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}