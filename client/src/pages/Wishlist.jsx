import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Package } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWishlist(); }, []);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setItems(res.data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems(items.filter(i => i.productId !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) { toast.error('Please sign in first'); setTimeout(() => navigate('/login'), 1500); return; }
    const result = await addToCart(productId, null, 1);
    if (result.success) {
      toast.success('Added to cart');
    } else {
      toast.error(result.error);
    }
  };

  const parseImages = (imgData) => {
    if (!imgData || imgData === '[]') return [];
    if (Array.isArray(imgData)) return imgData;
    try { return JSON.parse(imgData); } catch { return imgData.startsWith('http') ? [imgData] : []; }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-slate-500 text-sm">Loading wishlist...</span>
    </div>
  );

  if (!user) return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
        <Heart className="h-8 w-8 text-slate-300" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Sign in to view your wishlist</h2>
      <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" /> My Wishlist
        </h1>
        <span className="text-sm text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <Heart className="h-8 w-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-slate-500 mb-4">Save items you love for later</p>
          <Link to="/products" className="btn btn-primary btn-sm">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(({ id, product }) => (
            <div key={id} className="group card p-0 overflow-hidden">
              <div className="relative">
                <Link to={`/products/${product.slug}`}>
                  <div className="aspect-square bg-slate-100 overflow-hidden">
                    {parseImages(product.images)[0] ? (
                      <img src={parseImages(product.images)[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => removeItem(product.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-400 mb-1">{product.brand?.name || ' '}</p>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">{product.name}</h3>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">RM {product.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0}
                    className="btn btn-primary btn-sm rounded-lg px-2.5 py-1.5 disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </button>
                </div>
                {product.stock === 0 && (
                  <p className="text-xs text-red-500 mt-1">Out of stock</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}