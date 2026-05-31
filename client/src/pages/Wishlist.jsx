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
    if (!user) { toast.error('Please login first'); setTimeout(() => navigate('/login'), 1500); return; }
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading wishlist...</span>
    </div>
  );

  if (!user) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Login to view your wishlist</h2>
      <Link to="/login" className="btn btn-primary">Login</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-7 w-7 text-red-500 fill-red-500" />
          My Wishlist
        </h1>
        <span className="text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-4">Save items you love for later</p>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(({ id, product }) => (
            <div key={id} className="bg-white rounded-lg shadow-md overflow-hidden group">
              <div className="relative">
                <Link to={`/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {parseImages(product.images)[0] ? (
                      <img src={parseImages(product.images)[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package className="h-16 w-16 text-gray-300" />
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => removeItem(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>

              <div className="p-4">
                <Link to={`/products/${product.slug}`}>
                  <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary-600">{product.name}</h3>
                </Link>
                {product.brand && (
                  <div className="flex items-center gap-1.5 mb-2">
                    {product.brand.logo && <img src={product.brand.logo} alt={product.brand.name} className="h-3.5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />}
                    <p className="text-xs text-gray-500">{product.brand.name}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-primary-600">RM {product.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
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
