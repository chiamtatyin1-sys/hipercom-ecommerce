import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart, Tag, Folder, LogOut, MessageCircle, Settings, TicketPercent, Star, ArrowRightLeft, UserCheck, FileBarChart, Shield, AlertTriangle, Layers, Warehouse, CreditCard, Activity, Gift, ChevronDown, ChevronRight, Store, TrendingUp, Bell, Key, FileText, ToggleLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({ dashboard: true, system: true });

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isActive = (path) => location.pathname === path;

  const menuGroups = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      items: [{ path: '/admin', icon: LayoutDashboard, label: 'Overview' }],
    },
    {
      key: 'store',
      label: 'Store Management',
      icon: Store,
      items: [
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/brands', icon: Tag, label: 'Brands' },
        { path: '/admin/categories', icon: Folder, label: 'Categories' },
        { path: '/admin/variants', icon: Layers, label: 'Variants' },
        { path: '/admin/warehouses', icon: Warehouse, label: 'Warehouses' },
      ],
    },
    {
      key: 'orders',
      label: 'Orders & Payments',
      icon: ShoppingCart,
      items: [
        { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
        { path: '/admin/coupons', icon: TicketPercent, label: 'Coupons' },
      ],
    },
    {
      key: 'customers',
      label: 'Customers & Users',
      icon: Users,
      items: [
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/customers', icon: UserCheck, label: 'Customers' },
      ],
    },
    {
      key: 'analytics',
      label: 'Analytics & Reports',
      icon: TrendingUp,
      items: [
        { path: '/admin/accounting', icon: BarChart, label: 'Accounting' },
        { path: '/admin/reports', icon: FileBarChart, label: 'Reports' },
        { path: '/admin/audit', icon: Shield, label: 'Audit Log' },
      ],
    },
    {
      key: 'marketing',
      label: 'Marketing',
      icon: Gift,
      items: [
        { path: '/admin/reviews', icon: Star, label: 'Reviews' },
        { path: '/admin/referral-config', icon: Gift, label: 'Referral Config' },
        { path: '/admin/chat-history', icon: MessageCircle, label: 'Chat History' },
      ],
    },
    {
      key: 'system',
      label: 'System',
      icon: Settings,
      items: [
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
        { path: '/admin/stock-alerts', icon: AlertTriangle, label: 'Stock Alerts' },
        { path: '/admin/stock-transfer', icon: ArrowRightLeft, label: 'Stock Transfer' },
        { path: '/admin/monitoring', icon: Activity, label: 'Monitoring' },
        { path: '/admin/features', icon: ToggleLeft, label: 'Feature Flags' },
        { path: '/admin/logs', icon: FileText, label: 'Log Viewer' },
        { path: '/admin/api-keys', icon: Key, label: 'API Keys' },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="text-2xl font-bold text-primary-400">HiperCom</Link>
          <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuGroups.map(group => (
            <div key={group.key}>
              <button
                onClick={() => toggleGroup(group.key)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  group.items.some(item => isActive(item.path))
                    ? 'bg-gray-800 text-primary-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {group.icon && <group.icon className="h-4 w-4" />}
                  <span>{group.label}</span>
                </div>
                {openGroups[group.key] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {openGroups[group.key] && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {group.items.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive(item.path)
                          ? 'bg-gray-800 text-primary-400'
                          : 'text-gray-500 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => { logout(); window.location.href = '/'; }}
            className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-gray-800 w-full rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <span className="text-gray-600">Welcome, {user?.username}</span>
            <span className="badge badge-info">Admin</span>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
