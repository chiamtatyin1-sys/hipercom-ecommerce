import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const parseImages = (imgData) => {
  if (!imgData) return [];
  if (Array.isArray(imgData)) return imgData;
  try { return JSON.parse(imgData); } catch { return imgData.startsWith?.('http') ? [imgData] : []; }
};

export default function Category() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategory(); }, [slug]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get(`/categories/slug/${slug}`),
        api.get('/products', { params: { category: slug, limit: 50 } }),
      ]);
      setCategory(catRes.data);
      setProducts(prodRes.data.products || []);
    } catch (error) {
      console.error('Failed to fetch category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) { toast.error('Please sign in first'); setTimeout(() => navigate('/login'), 1500); return; }
    const result = await addToCart(product.id, null, 1);
    if (result.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.error);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-slate-200 aspect-square rounded-xl mb-3"></div>
          <div className="h-3 bg-slate-200 rounded mb-2 w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );

  if (!category) return (
    <div className="text-center py-20">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Category not found</h2>
      <Link to="/" className="btn btn-primary btn-sm mt-4">Back to Home</Link>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{category.name}</h1>
          {category.description && <p className="text-sm text-slate-500 mt-1">{category.description}</p>}
          <p className="text-xs text-slate-400 mt-1">{products.length} products</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No products in this category</h3>
          <p className="text-sm text-slate-500 mb-4">Check back soon for new arrivals</p>
          <Link to="/products" className="btn btn-primary btn-sm">Browse All Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(product => {
            const images = parseImages(product.images);
            return (
              <div key={product.id} className="group card p-0 overflow-hidden">
                <Link to={`/products/${product.slug}`}>
                  <div className="aspect-square bg-slate-100 overflow-hidden">
                    {images[0] ? (
                      <img src={images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Sparkles className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <p className="text-xs text-slate-400 mb-1">{product.brand?.name || ' '}</p>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3 w-3 text-amber-400 fill-current" />
                    <span className="text-xs text-slate-400">{product.averageRating?.toFixed(1) || '4.5'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">RM {product.price.toFixed(2)}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="btn btn-primary btn-sm rounded-lg px-2.5 py-1.5"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}