import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import SEO from './components/SEO';
import ErrorBoundary from './components/ErrorBoundary';

import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentComplete from './pages/PaymentComplete';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';

import SellerLayout from './seller/Layout';
import SellerDashboard from './seller/Dashboard';
import SellerProducts from './seller/Products';
import SellerOrders from './seller/Orders';
import SellerCustomers from './seller/Customers';
import SellerAnalytics from './seller/Analytics';
import SellerReferrals from './seller/Referrals';
import SellerSettings from './seller/Settings';
import SellerInventory from './seller/Inventory';
import SellerBranches from './seller/Branches';

import AdminLayout from './admin/Layout';
import AdminDashboard from './admin/Dashboard';
import AdminUsers from './admin/Users';
import AdminCustomers from './admin/Customers';
import AdminProducts from './admin/Products';
import AdminOrders from './admin/Orders';
import AdminAccounting from './admin/Accounting';
import AdminReports from './admin/Reports';
import AdminAuditLog from './admin/AuditLog';
import AdminStockAlerts from './admin/StockAlerts';
import AdminBrands from './admin/Brands';
import AdminCategories from './admin/Categories';
import AdminChatHistory from './admin/ChatHistory';
import AdminAISettings from './admin/AISettings';
import AdminEmailSettings from './admin/EmailSettings';
import AdminSettings from './admin/Settings';
import AdminCoupons from './admin/Coupons';
import AdminReviews from './admin/Reviews';
import AdminStockTransfer from './admin/StockTransfer';
import AdminVariants from './admin/Variants';
import AdminWarehouses from './admin/Warehouses';
import AdminPayments from './admin/Payments';
import AdminMonitoring from './admin/Monitoring';
import AdminReferralConfig from './admin/ReferralConfig';
import OrderReview from './pages/OrderReview';
import ProfileAddresses from './pages/ProfileAddresses';
import About from './pages/About';
import Contact from './pages/Contact';
import Category from './pages/Category';
import NotFound from './pages/NotFound';
import VerifyEmail from './pages/VerifyEmail';
import GoogleCallback from './pages/GoogleCallback';
import NotificationCenter from './pages/NotificationCenter';
import LoyaltyPage from './pages/LoyaltyPage';
import AISearch from './pages/AISearch';

import AdminFeatureFlags from './admin/FeatureFlags';
import AdminLogViewer from './admin/LogViewer';
import AdminApiKeys from './admin/ApiKeys';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <SettingsProvider>
            <Router>
              <SEO />
              <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:slug" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="payment/complete" element={<PaymentComplete />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password/:token" element={<ResetPassword />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:orderId" element={<OrderDetail />} />
                <Route path="track-order" element={<OrderTracking />} />
                <Route path="orders/:orderId/review" element={<OrderReview />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/addresses" element={<ProfileAddresses />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="category/:slug" element={<Category />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="auth/google/callback" element={<GoogleCallback />} />
                <Route path="notifications" element={<NotificationCenter />} />
                <Route path="loyalty" element={<LoyaltyPage />} />
                <Route path="ai-search" element={<AISearch />} />
              </Route>

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />

              {/* Seller Routes */}
              <Route path="/seller" element={<SellerLayout />}>
                <Route index element={<SellerDashboard />} />
                <Route path="products" element={<SellerProducts />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="customers" element={<SellerCustomers />} />
                <Route path="analytics" element={<SellerAnalytics />} />
                <Route path="referrals" element={<SellerReferrals />} />
                <Route path="settings" element={<SellerSettings />} />
                <Route path="inventory" element={<SellerInventory />} />
                <Route path="branches" element={<SellerBranches />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="accounting" element={<AdminAccounting />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="audit" element={<AdminAuditLog />} />
                <Route path="stock-alerts" element={<AdminStockAlerts />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="chat-history" element={<AdminChatHistory />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="stock-transfer" element={<AdminStockTransfer />} />
                <Route path="variants" element={<AdminVariants />} />
                <Route path="warehouses" element={<AdminWarehouses />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="monitoring" element={<AdminMonitoring />} />
                <Route path="referral-config" element={<AdminReferralConfig />} />
                <Route path="features" element={<AdminFeatureFlags />} />
                <Route path="logs" element={<AdminLogViewer />} />
                <Route path="api-keys" element={<AdminApiKeys />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
          <Toaster position="top-right" />
          </SettingsProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
