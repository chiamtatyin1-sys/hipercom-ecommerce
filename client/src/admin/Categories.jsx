import { useState, useEffect } from 'react';
import { Plus, X, Folder } from 'lucide-react';
import { categoriesApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getTree();
      setCategories(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/categories', formData);
      toast.success('Category added!');
      setShowModal(false);
      setFormData({ name: '', slug: '', icon: '' });
      fetchCategories();
    } catch (error) {
      toast.error('Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading categories...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Categories</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="card p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                <Folder className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat._count?.products || 0} products</p>
              </div>
            </div>
            {cat.children?.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-gray-200">
                {cat.children.map(child => (
                  <div key={child.id} className="text-sm text-gray-600 py-1">{child.name}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Category</h3>
              <button onClick={() => setShowModal(false)}><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon Class</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="input"
                  placeholder="laptop, phone, etc."
                />
              </div>
              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? 'Saving...' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}