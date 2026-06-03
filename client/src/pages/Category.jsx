import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart } from 'lucide-react';
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

  useEffect(() => {
    fetchCategory();
  }, [slug]);

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
    if (!user) { toast.error('Please login first'); setTimeout(() => navigate('/login'), 1500); return; }
    const result = await addToCart(product.id, null, 1);
    if (result.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.error);
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!category) return <div>Category not found</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && <p className="text-gray-600">{category.description}</p>}
        <p className="text-sm text-gray-500 mt-2">{products.length} products</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No products yet</h2>
          <p className="text-gray-500">Check back soon for new products in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(product => {
            const images = parseImages(product.images);
            return (
              <div key={product.id} className="card p-3 hover:shadow-lg transition-shadow group">
                <Link to={`/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    {images[0] ? (
                      <img src={images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                </Link>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary-600">{product.name}</h3>
                </Link>
                {product.brand && (
                  <div className="flex items-center gap-1.5 mb-1">
                    {product.brand.logo && <img src={product.brand.logo} alt={product.brand.name} className="h-3.5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />}
                    <p className="text-xs text-gray-500">{product.brand.name}</p>
                  </div>
                )}
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-500">{product.averageRating?.toFixed(1) || '4.5'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-primary-600 font-bold">RM {product.price.toFixed(2)}</p>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="btn btn-primary px-2 py-1 text-xs"
                  >
                    <ShoppingCart className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
