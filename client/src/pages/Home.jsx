import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Laptop, Smartphone, Headphones, Star, Zap, Shirt, Home as HomeIcon, Dumbbell, BookOpen, Coffee, Gamepad2, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        api.get('/products', { params: { featured: true, limit: 8 } }),
        api.get('/categories', { params: { limit: 10 } }),
        api.get('/brands', { params: { limit: 10 } }).catch(() => ({ data: [] })),
      ]);
      setFeaturedProducts(productsRes.data.products || []);
      setCategories((categoriesRes.data || []).slice(0, 8));
      setBrands(brandsRes.data?.brands || brandsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const categoryIcons = {
    'electronics': Zap,
    'fashion': Shirt,
    'home-living': HomeIcon,
    'sports': Dumbbell,
    'books': BookOpen,
    'beauty': Sparkles,
    'food-beverages': Coffee,
    'toys-games': Gamepad2,
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20 rounded-2xl mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Shop Everything You Love
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Discover amazing products across all categories at great prices
              </p>
              <Link to="/products" className="btn bg-white text-primary-600 hover:bg-gray-100 inline-flex items-center">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
              <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600" alt="Laptop" className="rounded-xl shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => {
            const Icon = categoryIcons[cat.slug] || Zap;
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <Icon className="h-10 w-10 mx-auto text-primary-600 mb-3" />
                <span className="font-medium">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Shop by Brand</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {brands.map(brand => (
              <Link
                key={brand.id}
                to={`/products?brand=${brand.id}`}
                className="flex-shrink-0 card p-4 hover:shadow-lg transition-shadow flex items-center justify-center min-w-[140px]"
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-10 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                ) : null}
                <span className={brand.logo ? 'hidden' : 'font-medium text-gray-700'}>{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link to="/products" className="text-primary-600 hover:text-primary-700 flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map(product => (
            <Link key={product.id} to={`/products/${product.slug}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-square bg-gray-100 relative">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Laptop className="h-20 w-20" />
                  </div>
                )}
                {product.isFeatured && (
                  <span className="absolute top-2 left-2 badge badge-success">Featured</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary-600 truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  {product.brand?.logo ? (
                    <img src={product.brand.logo} alt={product.brand.name} className="h-4 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : null}
                  <span className="text-gray-500 text-sm">{product.brand?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary-600">RM {product.price.toFixed(2)}</span>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm text-gray-500 ml-1">{product.averageRating?.toFixed(1) || '4.5'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card p-6 text-center">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Laptop className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Quality Products</h3>
          <p className="text-gray-600">All products are authentic and quality tested</p>
        </div>
        <div className="card p-6 text-center">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Headphones className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
          <p className="text-gray-600">Our AI chatbot and team are here to help</p>
        </div>
        <div className="card p-6 text-center">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
          <p className="text-gray-600">Free pickup at branches or fast shipping</p>
        </div>
      </section>
    </div>
  );
}