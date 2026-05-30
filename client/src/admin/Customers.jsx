import { useState, useEffect } from 'react';
import { Users, Search, Eye, Edit2, Trash2, Mail, Phone, Calendar, DollarSign, Package, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { fetchCustomers(); }, [pagination.page, roleFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 20, role: roleFilter };
      if (search) params.search = search;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.customers);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchCustomers();
  };

  const viewCustomer = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
      setShowDetail(true);
    } catch (error) {
      toast.error('Failed to load customer details');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/customers/${id}`, { isActive: !currentStatus });
      toast.success('Customer updated');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to update customer');
    }
  };

  const deleteCustomer = async (id) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  if (loading && !customers.length) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading customers...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" /> Customers
        </h2>
        <span className="text-gray-500">{pagination.total} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="input pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }} className="input">
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="seller">Sellers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Customer</th>
              <th className="text-left py-3 px-4">Contact</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">Orders</th>
              <th className="text-left py-3 px-4">Spent</th>
              <th className="text-left py-3 px-4">Joined</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-8 text-gray-500">No customers found</td></tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{customer.username}</p>
                      <p className="text-xs text-gray-500">{customer.referralCode}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</p>
                      {customer.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</p>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      customer.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      customer.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{customer.role}</span>
                  </td>
                  <td className="py-3 px-4">{customer.orderCount || 0}</td>
                  <td className="py-3 px-4 font-medium">RM {(customer.totalSpent || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleStatus(customer.id, customer.isActive)} className={`px-2 py-0.5 rounded text-xs ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => viewCustomer(customer.id)} className="p-1 text-gray-400 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => deleteCustomer(customer.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} disabled={pagination.page <= 1} className="btn btn-secondary px-3 py-1 text-sm disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} disabled={pagination.page >= pagination.pages} className="btn btn-secondary px-3 py-1 text-sm disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {showDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Customer Details</h3>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3">Profile</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Username:</span> {selectedCustomer.customer.username}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedCustomer.customer.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedCustomer.customer.phone || 'N/A'}</p>
                    <p><span className="text-gray-500">Role:</span> {selectedCustomer.customer.role}</p>
                    <p><span className="text-gray-500">Wallet:</span> RM {(selectedCustomer.customer.wallet || 0).toFixed(2)}</p>
                    <p><span className="text-gray-500">Joined:</span> {new Date(selectedCustomer.customer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Stats</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <Package className="h-5 w-5 mx-auto text-blue-600" />
                      <p className="text-lg font-bold">{selectedCustomer.orders.length}</p>
                      <p className="text-xs text-gray-500">Orders</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <DollarSign className="h-5 w-5 mx-auto text-green-600" />
                      <p className="text-lg font-bold">RM {selectedCustomer.orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Spent</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <Star className="h-5 w-5 mx-auto text-yellow-600" />
                      <p className="text-lg font-bold">{selectedCustomer.reviews.length}</p>
                      <p className="text-xs text-gray-500">Reviews</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <h4 className="font-medium mb-3">Recent Orders</h4>
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-sm text-gray-500 mb-6">No orders yet</p>
              ) : (
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Order #</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Items</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.orders.slice(0, 10).map(order => (
                        <tr key={order.id} className="border-b">
                          <td className="py-2">{order.orderNumber}</td>
                          <td className="py-2 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="py-2">{order.items?.length || 0}</td>
                          <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></td>
                          <td className="py-2 text-right font-medium">RM {order.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Reviews */}
              {selectedCustomer.reviews.length > 0 && (
                <>
                  <h4 className="font-medium mb-3">Reviews</h4>
                  <div className="space-y-2">
                    {selectedCustomer.reviews.map(review => (
                      <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                          <span className="text-sm text-gray-500">{review.product?.name}</span>
                        </div>
                        {review.comment && <p className="text-sm mt-1">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
