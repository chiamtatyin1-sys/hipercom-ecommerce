import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Zap, Shirt, Home as HomeIcon, Dumbbell, BookOpen, Coffee, Gamepad2, Sparkles, Truck, Shield, Headphones, ChevronRight } from 'lucide-react';
import api from '../services/api';

const categoryIcons = {
  electronics: Zap,
  fashion: Shirt,
  'home-living': HomeIcon,
  sports: Dumbbell,
  books: BookOpen,
  beauty: Sparkles,
  'food-beverages': Coffee,
  'toys-games': Gamepad2,
};

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => { fetchData(); }, []);

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

  return (
    <div>
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-slate-900 rounded-2xl p-8 md:p-12 flex flex-col justify-center text-white">
          <span className="text-blue-400 text-sm font-medium mb-3 tracking-wide uppercase">New Arrivals</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
            Everything You
            <br />
            <span className="text-blue-400">Love, Delivered</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base mb-8 max-w-md leading-relaxed">
            From electronics to fashion, beauty to books — shop across 8 categories with free shipping on orders over RM100.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/products" className="btn btn-primary btn-lg rounded-xl bg-blue-500 hover:bg-blue-400 border-0">
              Shop Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</Link>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 md:p-12 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/4 -translate-x-1/4" />
          <div className="relative">
            <Sparkles className="h-8 w-8 mb-4 text-blue-200" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">AI-Powered Shopping</h2>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              Can't find what you need? Describe it to our AI and let it find the perfect product for you.
            </p>
            <Link to="/ai-search" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Try AI Search <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Shop by Category</h2>
            <p className="text-sm text-slate-500 mt-0.5">Find exactly what you're looking for</p>
          </div>
          <Link to="/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map(cat => {
            const Icon = categoryIcons[cat.slug] || Sparkles;
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group card-static p-5 text-center hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Icon className="h-6 w-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Top Brands</h2>
              <p className="text-sm text-slate-500 mt-0.5">Shop from your favorite brands</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {brands.map(brand => (
              <Link
                key={brand.id}
                to={`/products?brand=${brand.id}`}
                className="card-static flex-shrink-0 p-4 min-w-[140px] flex flex-col items-center justify-center gap-2 hover:border-blue-200 transition-all"
              >
                {brand.logo ? (
                  <>
                    <img src={brand.logo} alt={brand.name} className="h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg items-center justify-center font-bold text-xs hidden">{brand.name.charAt(0)}</span>
                  </>
                ) : (
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{brand.name.charAt(0)}</span>
                )}
                <span className="text-xs text-slate-500">{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Featured Products</h2>
            <p className="text-sm text-slate-500 mt-0.5">Handpicked for you</p>
          </div>
          <Link to="/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredProducts.map(product => (
            <Link key={product.id} to={`/products/${product.slug}`} className="group card p-0 overflow-hidden">
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Sparkles className="h-12 w-12" />
                  </div>
                )}
                {product.isFeatured && (
                  <span className="absolute top-2 left-2 badge badge-success text-[10px] px-2 py-0.5">Featured</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-400 mb-1">{product.brand?.name || ' '}</p>
                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">RM {product.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs text-slate-400">{product.averageRating?.toFixed(1) || '4.5'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="card-static p-6 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Quality Products</h3>
            <p className="text-xs text-slate-500 leading-relaxed">All products are authentic and carefully quality-tested before listing.</p>
          </div>
        </div>
        <div className="card-static p-6 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Headphones className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">24/7 Support</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Our AI chatbot and support team are always ready to help you.</p>
          </div>
        </div>
        <div className="card-static p-6 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Truck className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Fast Delivery</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Free shipping on orders over RM100. Pickup at branches available.</p>
          </div>
        </div>
      </section>
    </div>
  );
}