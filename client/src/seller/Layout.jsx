import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Gift, Settings, LogOut, Warehouse, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/seller', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/seller/products', icon: Package, label: 'Products' },
    { path: '/seller/inventory', icon: Warehouse, label: 'Inventory' },
    { path: '/seller/branches', icon: MapPin, label: 'Branches' },
    { path: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/seller/customers', icon: Users, label: 'Customers' },
    { path: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/seller/referrals', icon: Gift, label: 'Referrals' },
    { path: '/seller/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <Link to="/" className="text-2xl font-bold text-primary-600">HiperCom</Link>
          <p className="text-sm text-gray-500 mt-1">Seller Dashboard</p>
        </div>

        <nav className="p-4">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t mt-auto">
          <button
            onClick={() => { logout(); window.location.href = '/'; }}
            className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Seller Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.username}</span>
            <span className="badge badge-success capitalize">{user?.role}</span>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}