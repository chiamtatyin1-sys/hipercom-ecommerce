import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Package } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminVariants() {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [formData, setFormData] = useState({ variantName: '', variantValue: '', additionalPrice: '', sku: '', stock: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prodsRes, varsRes] = await Promise.all([
        api.get('/products', { params: { limit: 100 } }),
        api.get('/variants'),
      ]);
      setProducts(prodsRes.data.products);
      setVariants(varsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error('Select a product');
    try {
      const payload = { ...formData, productId: selectedProduct, additionalPrice: parseFloat(formData.additionalPrice) || 0, stock: parseInt(formData.stock) || 0 };
      if (editingVariant) {
        await api.put(`/variants/${editingVariant.id}`, payload);
        toast.success('Variant updated');
      } else {
        await api.post('/variants', payload);
        toast.success('Variant added');
      }
      setShowModal(false);
      setEditingVariant(null);
      setFormData({ variantName: '', variantValue: '', additionalPrice: '', sku: '', stock: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save variant');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this variant?')) {
      try {
        await api.delete(`/variants/${id}`);
        toast.success('Variant deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const productVariants = variants.filter(v => v.productId === selectedProduct);
  const selectedProductData = products.find(p => p.id === selectedProduct);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading variants...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" /> Product Variants</h2>
        {selectedProduct && (
          <button onClick={() => { setShowModal(true); setEditingVariant(null); setFormData({ variantName: '', variantValue: '', additionalPrice: '', sku: '', stock: '' }); }} className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Variant
          </button>
        )}
      </div>

      <div className="card p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Select Product</label>
        <select value={selectedProduct || ''} onChange={(e) => setSelectedProduct(e.target.value || null)} className="input">
          <option value="">Choose a product...</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
        </select>
      </div>

      {selectedProduct && (
        <>
          <div className="card p-4 mb-4 bg-gray-50">
            <p className="text-sm text-gray-500">Product: <span className="font-medium">{selectedProductData?.name}</span></p>
            <p className="text-sm text-gray-500">Base Price: <span className="font-medium">RM {selectedProductData?.price.toFixed(2)}</span></p>
            <p className="text-sm text-gray-500">Variants: <span className="font-medium">{productVariants.length}</span></p>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Variant</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Value</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Additional Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Final Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {productVariants.map(v => (
                  <tr key={v.id}>
                    <td className="px-6 py-4 font-medium">{v.variantName}</td>
                    <td className="px-6 py-4">{v.variantValue}</td>
                    <td className="px-6 py-4">RM {v.additionalPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-green-600">RM {(selectedProductData?.price + v.additionalPrice).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{v.sku}</td>
                    <td className="px-6 py-4">{v.stock}</td>
                    <td className="px-6 py-4"><span className={`badge ${v.isActive ? 'badge-success' : 'badge-error'}`}>{v.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button onClick={() => { setEditingVariant(v); setFormData({ variantName: v.variantName, variantValue: v.variantValue, additionalPrice: v.additionalPrice, sku: v.sku, stock: v.stock }); setShowModal(true); }} className="text-primary-600 hover:text-primary-700"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productVariants.length === 0 && <p className="text-gray-500 text-center py-8">No variants for this product</p>}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setEditingVariant(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{editingVariant ? 'Edit Variant' : 'Add Variant'}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedProductData?.name}</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditingVariant(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Variant Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.variantName}
                    onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                    className="input w-full"
                    placeholder="e.g. Color, Size"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Variant Value <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.variantValue}
                    onChange={(e) => setFormData({ ...formData, variantValue: e.target.value })}
                    className="input w-full"
                    placeholder="e.g. Red, Large"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Price (RM)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">RM</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.additionalPrice}
                    onChange={(e) => setFormData({ ...formData, additionalPrice: e.target.value })}
                    className="input w-full pl-10"
                    placeholder="0.00"
                  />
                </div>
                {formData.additionalPrice && selectedProductData && (
                  <p className="text-xs text-gray-500 mt-1">Final price: RM {(selectedProductData.price + parseFloat(formData.additionalPrice || 0)).toFixed(2)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SKU <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="input w-full font-mono"
                    placeholder="VAR-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input w-full"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingVariant(null); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingVariant ? 'Update Variant' : 'Add Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
