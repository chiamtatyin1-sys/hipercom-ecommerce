import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Edit, CheckSquare, Square, Upload, Download, DollarSign, Tag, Image, Camera } from 'lucide-react';
import api, { productsApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
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
    images: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [importData, setImportData] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prodsRes, catsRes, brandsRes] = await Promise.all([
        api.get('/products', { params: { limit: 50 } }),
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setProducts(prodsRes.data.products);
      setCategories(catsRes.data);
      setBrands(brandsRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImageFiles(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setImageUrls(urls);
  };

  const handleImageRemove = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async () => {
    if (imageFiles.length === 0) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      imageFiles.forEach(file => uploadFormData.append('images', file));
      const res = await productsApi.uploadImages(uploadFormData);
      const existingImages = formData.images ? JSON.parse(formData.images || '[]') : [];
      const allImages = [...existingImages, ...res.data.images];
      setFormData(prev => ({ ...prev, images: JSON.stringify(allImages) }));
      toast.success(`${res.data.images.length} image(s) uploaded`);
      setImageFiles([]);
      setImageUrls([]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
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
      setFormData({ name: '', price: '', sku: '', description: '', stock: '', categoryId: '', brandId: '', images: '' });
      setImageFiles([]);
      setImageUrls([]);
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
    setFormData({ name: '', price: '', sku: '', description: '', stock: '', categoryId: '', brandId: '', images: '' });
    setImageFiles([]);
    setImageUrls([]);
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

  const handleBulkDelete = async () => {
    try {
      await api.post('/bulk/bulk-delete', { productIds: selectedProducts });
      toast.success(`${selectedProducts.length} products deleted`);
      setSelectedProducts([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bulk delete failed');
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkAction || !bulkValue) return toast.error('Action and value required');
    try {
      const updates = {};
      if (bulkAction === 'price') updates.price = parseFloat(bulkValue);
      else if (bulkAction === 'category') updates.categoryId = bulkValue;
      else if (bulkAction === 'stock') updates.stock = parseInt(bulkValue);
      else if (bulkAction === 'status') updates.isActive = bulkValue === 'active';
      await api.post('/bulk/bulk-update', { productIds: selectedProducts, updates });
      toast.success(`${selectedProducts.length} products updated`);
      setSelectedProducts([]);
      setShowBulkModal(false);
      setBulkValue('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bulk update failed');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) return toast.error('CSV data required');
    try {
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const products = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i]?.trim() || '');
        return obj;
      });
      const res = await api.post('/bulk/import', { products });
      toast.success(`Imported ${res.data.created} products (${res.data.errors} errors)`);
      setShowImportModal(false);
      setImportData('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Import failed');
    }
  };

  const parseImages = (imgData) => {
    if (!imgData) return [];
    if (Array.isArray(imgData)) return imgData;
    try { return JSON.parse(imgData); } catch { return imgData.startsWith?.('http') ? [imgData] : []; }
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
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary flex items-center gap-2">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={() => { setShowModal(true); setEditingProduct(null); setFormData({ name: '', price: '', sku: '', description: '', stock: '', categoryId: '', brandId: '', images: '' }); setImageFiles([]); setImageUrls([]); }} className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="card p-4 mb-4 bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{selectedProducts.length} products selected</span>
            <div className="flex gap-2">
              <button onClick={() => { setBulkAction('price'); setShowBulkModal(true); }} className="btn btn-secondary px-3 py-1 text-sm flex items-center gap-1"><DollarSign className="h-3 w-3" /> Update Price</button>
              <button onClick={() => { setBulkAction('category'); setShowBulkModal(true); }} className="btn btn-secondary px-3 py-1 text-sm flex items-center gap-1"><Tag className="h-3 w-3" /> Update Category</button>
              <button onClick={() => { if (confirm(`Delete ${selectedProducts.length} products?`)) handleBulkDelete(); }} className="btn bg-red-600 text-white px-3 py-1 text-sm flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
              <button onClick={() => setSelectedProducts([])} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium w-10">
                <button onClick={() => { if (selectedProducts.length === products.length) setSelectedProducts([]); else setSelectedProducts(products.map(p => p.id)); }}>
                  {selectedProducts.length === products.length && products.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium">Image</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Brand</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Price</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => {
              const images = parseImages(p.images);
              const firstImage = images[0];
              return (
                <tr key={p.id} className={selectedProducts.includes(p.id) ? 'bg-primary-50' : ''}>
                  <td className="px-4 py-4">
                    <button onClick={() => { if (selectedProducts.includes(p.id)) setSelectedProducts(selectedProducts.filter(id => id !== p.id)); else setSelectedProducts([...selectedProducts, p.id]); }}>
                      {selectedProducts.includes(p.id) ? <CheckSquare className="h-4 w-4 text-primary-600" /> : <Square className="h-4 w-4 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {firstImage ? (
                      <img src={firstImage} alt={p.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <Image className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4">
                    {p.category?.name || <span className="text-gray-400 italic">No category</span>}
                  </td>
                  <td className="px-6 py-4">
                    {p.brand?.name || <span className="text-gray-400 italic">No brand</span>}
                  </td>
                  <td className="px-6 py-4">RM {p.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{p.stock}</td>
                  <td className="px-6 py-4"><span className={`badge ${p.isActive ? 'badge-success' : 'badge-error'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
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
                        images: p.images || '',
                      });
                      setImageFiles([]);
                      setImageUrls([]);
                      setShowModal(true);
                    }} className="text-primary-600 hover:text-primary-700">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-1">Product Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to select images (max 5)</span>
                  </label>
                </div>

                {imageUrls.length > 0 && (
                  <div className="mt-3">
                    <div className="flex gap-2 flex-wrap">
                      {imageUrls.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img src={url} alt={`Preview ${idx}`} className="w-16 h-16 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => handleImageRemove(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className="btn btn-secondary mt-2 text-sm flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" /> {uploading ? 'Uploading...' : 'Upload Images'}
                    </button>
                  </div>
                )}

                {formData.images && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Current images:</p>
                    <div className="flex gap-2 flex-wrap">
                      {parseImages(formData.images).map((url, idx) => (
                        <img key={idx} src={url} alt={`Product ${idx}`} className="w-12 h-12 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Bulk Update - {bulkAction}</h3>
              <button onClick={() => { setShowBulkModal(false); setBulkValue(''); }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {bulkAction === 'price' && (
                <div>
                  <label className="block text-sm font-medium mb-1">New Price (RM)</label>
                  <input type="number" step="0.01" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="input" placeholder="0.00" />
                </div>
              )}
              {bulkAction === 'category' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="input">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {bulkAction === 'stock' && (
                <div>
                  <label className="block text-sm font-medium mb-1">New Stock Quantity</label>
                  <input type="number" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="input" placeholder="0" />
                </div>
              )}
              {bulkAction === 'status' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
              <button onClick={handleBulkUpdate} className="btn btn-primary w-full">Update {selectedProducts.length} Products</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Import Products (CSV)</h3>
              <button onClick={() => { setShowImportModal(false); setImportData(''); }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                <p className="font-bold mb-1">CSV Format (first row = headers):</p>
                <p>name,price,stock,sku,description,categoryId,brandId,isActive,isFeatured</p>
                <p className="mt-1 text-gray-500">Example: Widget,29.99,100,WID-001,A cool widget,,brand1,true,false</p>
              </div>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="input h-48 font-mono text-sm"
                placeholder="name,price,stock,sku,description&#10;Product 1,19.99,50,SKU-001,Description here&#10;Product 2,29.99,100,SKU-002,Another product"
              />
              <button onClick={handleImport} className="btn btn-primary w-full">Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}