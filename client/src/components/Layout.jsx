import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, User, Menu, X, MessageCircle, Heart, Gift, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ChatBot from './ChatBot';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-primary-600">
              HiperCom
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>

            {/* Nav */}
            <div className="flex items-center space-x-4">
              <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-red-500">
                <Heart className="h-6 w-6" />
              </Link>
              {user && <NotificationBell />}
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-1 p-2 text-gray-600 hover:text-primary-600"
                  >
                    <User className="h-6 w-6" />
                    <span className="hidden sm:inline">{user.username}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link to="/ai-search" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                        <Sparkles className="h-4 w-4 text-primary-600" />
                        AI Search
                      </Link>
                      <Link to="/notifications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </Link>
                      <Link to="/loyalty" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                        <Gift className="h-4 w-4" />
                        Loyalty Points
                      </Link>
                      <div className="border-t my-1"></div>
                      <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Wishlist</Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Orders</Link>
                      <Link to="/track-order" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Track Order</Link>
                      <Link to="/profile/addresses" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Addresses</Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</Link>
                      {user.role === 'seller' && (
                        <Link to="/seller" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Seller Dashboard</Link>
                      )}
                      {user.role === 'admin' && (
                        <>
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Admin Dashboard</Link>
                          <Link to="/seller" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Seller Dashboard</Link>
                        </>
                      )}
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary">Login</Link>
              )}

              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t py-4 px-4">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </form>
            <nav className="space-y-2">
              <Link to="/products" className="block py-2 text-gray-700">All Products</Link>
              <Link to="/products?search=laptop" className="block py-2 text-gray-700">Laptops</Link>
              <Link to="/products?search=digital" className="block py-2 text-gray-700">Digital Goods</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">HiperCom</h3>
              <p className="text-gray-400">Your trusted online store for laptops and digital products.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products" className="hover:text-white">All Products</Link></li>
                <li><Link to="/products?search=laptop" className="hover:text-white">Laptops</Link></li>
                <li><Link to="/products?search=digital" className="hover:text-white">Digital Goods</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/track-order" className="hover:text-white">Track Order</Link></li>
                <li><Link to="/returns" className="hover:text-white">Returns Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms &amp; Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">info@hipercom.com.my</p>
              <p className="text-gray-400">+60 123 456 789</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2026 HiperCom. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Chat Bot Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {showChat && <ChatBot onClose={() => setShowChat(false)} />}
    </div>
  );
}