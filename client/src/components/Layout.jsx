import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Search, User, Menu, X, MessageCircle, Heart, ShoppingCart, Package, Truck, Sparkles, Home, Shirt, Zap, Dumbbell, BookOpen, Coffee, Gamepad2, Monitor, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ChatBot from './ChatBot';
import NotificationBell from './NotificationBell';
import api from '../services/api';

const categoryIcons = {
  electronics: Monitor,
  fashion: Shirt,
  'home-living': Home,
  sports: Dumbbell,
  books: BookOpen,
  beauty: Sparkles,
  'food-beverages': Coffee,
  'toys-games': Gamepad2,
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const userMenuRef = useRef(null);

  useEffect(() => {
    api.get('/categories', { params: { limit: 20 } })
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const isHome = location.pathname === '/';

  const breadcrumbs = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const crumbs = [{ label: 'Home', to: '/' }];
    if (parts[0] === 'products' && parts[1]) {
      crumbs.push({ label: 'Products', to: '/products' });
      crumbs.push({ label: '', to: null });
    } else if (parts[0] === 'products') {
      crumbs.push({ label: 'All Products', to: null });
    } else if (parts[0] === 'category' && parts[1]) {
      crumbs.push({ label: '', to: null });
    } else if (parts[0] === 'cart') {
      crumbs.push({ label: 'Cart', to: null });
    } else if (parts[0] === 'checkout') {
      crumbs.push({ label: 'Cart', to: '/cart' });
      crumbs.push({ label: 'Checkout', to: null });
    } else if (parts[0] === 'wishlist') {
      crumbs.push({ label: 'Wishlist', to: null });
    } else if (parts[0] === 'orders' && parts[1]) {
      crumbs.push({ label: 'Orders', to: '/orders' });
      crumbs.push({ label: `#${parts[1]}`, to: null });
    } else if (parts[0] === 'orders') {
      crumbs.push({ label: 'My Orders', to: null });
    } else if (parts[0] === 'ai-search') {
      crumbs.push({ label: 'AI Search', to: null });
    } else if (parts[0] === 'profile') {
      crumbs.push({ label: 'Profile', to: null });
    } else if (parts[0] === 'about') {
      crumbs.push({ label: 'About Us', to: null });
    } else if (parts[0] === 'contact') {
      crumbs.push({ label: 'Contact', to: null });
    } else {
      crumbs.push({ label: parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), to: null });
    }
    return crumbs;
  })();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
          <span className="hidden sm:flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-blue-400" />
            Free shipping on orders over RM100
          </span>
          <div className="flex items-center gap-4 ml-auto">
            <Link to="/track-order" className="hover:text-white transition-colors">Track Order</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="text-xl font-bold text-slate-900 tracking-tight flex-shrink-0">
              Hiper<span className="text-blue-600">Com</span>
            </Link>

            {/* Search - desktop only */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md ml-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              <Link to="/wishlist" className="p-2 text-slate-500 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors">
                <Heart className="h-5 w-5" />
              </Link>
              {user && <NotificationBell />}
              <Link to="/cart" className="relative p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{user.username}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">My Orders</Link>
                      <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Wishlist</Link>
                      <Link to="/profile/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Addresses</Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Profile</Link>
                      {user.role === 'seller' && (
                        <Link to="/seller" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-slate-50">Seller Dashboard</Link>
                      )}
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-slate-50">Admin Dashboard</Link>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm hidden md:inline-flex">Sign In</Link>
              )}

              {/* Hamburger - tablet and below */}
              <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 md:hidden">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl animate-fade-slide-in">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {user && (
              <div className="px-4 py-3 border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{user.username?.charAt(0).toUpperCase()}</div>
                <div><p className="text-sm font-medium">{user.username}</p><p className="text-xs text-slate-500">{user.email}</p></div>
              </div>
            )}
            <div className="p-4">
              <form onSubmit={handleSearch} className="mb-4">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="input" />
              </form>
              <nav className="space-y-0.5">
                <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Home</Link>
                <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>All Products</Link>
                <Link to="/ai-search" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>
                  <Sparkles className="h-4 w-4 text-blue-500" /> AI Search
                </Link>
                <div className="border-t my-2" />
                <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</p>
                {categories.map(cat => {
                  const Icon = categoryIcons[cat.slug] || Package;
                  return (
                    <Link key={cat.id} to={`/category/${cat.slug}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>
                      <Icon className="h-4 w-4 text-slate-400" /> {cat.name}
                    </Link>
                  );
                })}
                <div className="border-t my-2" />
                <Link to="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>My Orders</Link>
                <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Wishlist</Link>
                <Link to="/cart" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Cart {itemCount > 0 && `(${itemCount})`}</Link>
                <Link to="/track-order" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Track Order</Link>
                <Link to="/contact" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Contact</Link>
                {user ? (
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-2">Sign Out</button>
                ) : (
                  <Link to="/login" className="btn btn-primary w-full mt-4" onClick={() => setMobileOpen(false)}>Sign In</Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs && !isHome && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-300">/</span>}
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-blue-600 transition-colors">{crumb.label}</Link>
                  ) : (
                    <span className="text-slate-400">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main */}
      <main className={`flex-1 ${isHome ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="text-lg font-bold text-white">Hiper<span className="text-blue-400">Com</span></Link>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Your one-stop online store for everything — electronics, fashion, beauty, sports, books, toys, and more.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/products" className="text-slate-400 hover:text-white transition-colors">Products</Link></li>
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/track-order" className="text-slate-400 hover:text-white transition-colors">Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Categories</h4>
              <ul className="space-y-2.5 text-sm">
                {categories.slice(0, 6).map(cat => (
                  <li key={cat.id}>
                    <Link to={`/category/${cat.slug}`} className="text-slate-400 hover:text-white transition-colors">{cat.name}</Link>
                  </li>
                ))}
                {categories.length === 0 && (
                  <>
                    <li><Link to="/products" className="text-slate-400 hover:text-white transition-colors">Electronics</Link></li>
                    <li><Link to="/products" className="text-slate-400 hover:text-white transition-colors">Fashion</Link></li>
                    <li><Link to="/products" className="text-slate-400 hover:text-white transition-colors">Sports</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/returns" className="text-slate-400 hover:text-white transition-colors">Returns</Link></li>
                <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy</Link></li>
              </ul>
              <div className="mt-4 space-y-1.5 text-sm text-slate-400">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@hipercom.com.my</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +60 123 456 789</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>&copy; 2026 HiperCom. All rights reserved.</span>
            <span>Secure payments via HitPay</span>
          </div>
        </div>
      </footer>

      {/* Chat */}
      <button onClick={() => setShowChat(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-3.5 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-40">
        <MessageCircle className="h-5 w-5" />
      </button>
      {showChat && <ChatBot onClose={() => setShowChat(false)} />}
    </div>
  );
}