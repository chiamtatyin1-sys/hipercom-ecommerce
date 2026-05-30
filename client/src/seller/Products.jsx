import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sku: '',
    description: '',
    stock: '',
    categoryId: '',
    brandId: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prodsRes, catsRes, brandsRes] = await Promise.all([
        api.get('/products', { params: { limit: 100 } }),
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setProducts(prodsRes.data.products);
      setCategories(catsRes.data);
      setBrands(brandsRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId || null,
        brandId: formData.brandId || null,
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product added!');
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', sku: '', description: '', stock: '', categoryId: '', brandId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', sku: '', description: '', stock: '', categoryId: '', brandId: '' });
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading products...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Products</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Brand</th>
              <th className="px-6 py-3 text-left text-sm font-medium">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Price</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4">{p.name}</td>
                <td className="px-6 py-4">
                  {p.category?.name || <span className="text-gray-400 italic">No category</span>}
                </td>
                <td className="px-6 py-4">
                  {p.brand?.name || <span className="text-gray-400 italic">No brand</span>}
                </td>
                <td className="px-6 py-4 text-gray-500">{p.sku}</td>
                <td className="px-6 py-4">RM {p.price.toFixed(2)}</td>
                <td className="px-6 py-4"><span className={`badge ${p.stock > 10 ? 'badge-success' : 'badge-warning'}`}>{p.stock}</span></td>
                <td className="px-6 py-4 flex space-x-2">
                  <button onClick={() => {
                    setEditingProduct(p);
                    setFormData({
                      name: p.name || '',
                      price: p.price || '',
                      sku: p.sku || '',
                      description: p.description || '',
                      stock: p.stock || '',
                      categoryId: p.categoryId || '',
                      brandId: p.brandId || '',
                    });
                    setShowModal(true);
                  }} className="text-primary-600 hover:text-primary-700"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No products yet</p>
            <p className="text-sm mt-1">Click "Add Product" to get started</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="input"
                  >
                    <option value="">-- No Brand --</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (RM) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="input"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input h-24"
                  placeholder="Product description..."
                />
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}