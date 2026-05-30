import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SellerCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'customer', limit: 50 } });
      setUsers(res.data.users);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading customers...</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Customers</h2>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Username</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4">{u.username}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">{u.phone || '-'}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No customers yet</p>
            <p className="text-sm mt-1">Customers will appear here once they register</p>
          </div>
        )}
      </div>
    </div>
  );
}