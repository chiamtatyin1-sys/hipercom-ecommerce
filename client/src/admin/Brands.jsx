import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import { brandsApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({ name: '', slug: '', logo: '', description: '' });
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    try {
      const res = await brandsApi.getAll();
      setBrands(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({ name: '', slug: '', logo: '', description: '' });
    setSelectedFile(null);
    setPreviewUrl('');
    setShowModal(true);
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, slug: brand.slug, logo: brand.logo || '', description: brand.description || '' });
    setSelectedFile(null);
    setPreviewUrl(brand.logo || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBrand) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('slug', formData.slug);
        formDataToSend.append('description', formData.description || '');
        if (selectedFile) {
          formDataToSend.append('logo', selectedFile);
        }
        await brandsApi.update(editingBrand.id, formDataToSend);
        toast.success('Brand updated!');
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('slug', formData.slug);
        formDataToSend.append('description', formData.description || '');
        if (selectedFile) {
          formDataToSend.append('logo', selectedFile);
        }
        await brandsApi.create(formDataToSend);
        toast.success('Brand added!');
      }
      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', slug: '', logo: '', description: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      fetchBrands();
    } catch (error) {
      toast.error(editingBrand ? 'Failed to update brand' : 'Failed to add brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand) => {
    try {
      await brandsApi.delete(brand.id);
      toast.success('Brand deleted!');
      setDeleteConfirm(null);
      fetchBrands();
    } catch (error) {
      toast.error('Failed to delete brand');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading brands...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Brands</h2>
        <button onClick={openAddModal} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />Add Brand
        </button>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className="card p-4">
              <div className="flex items-center">
                {brand.logo ? (
                  <>
                    <img src={brand.logo} alt={brand.name} className="w-12 h-12 rounded-lg mr-4 object-contain bg-white" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    <span className="w-12 h-12 rounded-lg mr-4 bg-indigo-100 text-indigo-600 items-center justify-center font-bold text-sm" style={{ display: 'none' }}>{brand.name.charAt(0)}</span>
                  </>
                ) : (
                  <span className="w-12 h-12 rounded-lg mr-4 bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">{brand.name.charAt(0)}</span>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{brand.name}</h3>
                  <p className="text-sm text-gray-500">{brand._count?.products || 0} products</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => openEditModal(brand)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteConfirm(brand)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingBrand ? 'Edit Brand' : 'Add New Brand'}</h3>
              <button onClick={() => { setShowModal(false); setEditingBrand(null); }}><X className="h-6 w-6" /></button>
            </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logo Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="input"
                  />
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="mt-2 h-20 object-contain" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input h-20"
                    placeholder="Optional description..."
                  />
                </div>
                <button type="submit" disabled={saving} className="btn btn-primary w-full">
                  {saving ? 'Saving...' : editingBrand ? 'Update Brand' : 'Add Brand'}
                </button>
              </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Delete Brand</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
