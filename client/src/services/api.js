import axios from 'axios';

const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set token on init
if (getToken()) {
  api.defaults.headers.common['Authorization'] = `Bearer ${getToken()}`;
}

let isRefreshing = false;

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (!token) {
        return Promise.reject(error);
      }
      if (!isRefreshing) {
        isRefreshing = true;
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        window.dispatchEvent(new Event('auth:logout'));
        setTimeout(() => { isRefreshing = false; }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Product API
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImages: (formData) => api.post('/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Order API
export const ordersApi = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status, notes) => api.put(`/orders/${id}/status`, { status, notes }),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  cancel: (id) => api.delete(`/orders/${id}`),
  getStatusHistory: (id) => api.get(`/orders/${id}/status-history`),
};

// Payment API
export const paymentsApi = {
  getAll: (params) => api.get('/payments', { params }),
  create: (orderId) => api.post(`/payments/create/${orderId}`),
  createQR: (orderId, method) => api.post(`/payments/create-qr/${orderId}`, { paymentMethod: method }),
  getStatus: (orderId) => api.get(`/payments/status/${orderId}`),
  refund: (orderId, amount, reason) => api.post(`/payments/refund/${orderId}`, { amount, reason }),
  getRefunds: (params) => api.get('/payments/refunds', { params }),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getTree: () => api.get('/categories/tree'),
  getById: (id) => api.get(`/categories/${id}`),
};

// Brands API
export const brandsApi = {
  getAll: () => api.get('/brands'),
  getById: (id) => api.get(`/brands/${id}`),
};

// Chat API
export const chatApi = {
  sendMessage: (message, sessionId) => api.post('/chat/message', { message, sessionId }),
  getHistory: (sessionId) => api.get('/chat/history', { params: { sessionId } }),
};

// Accounting API
export const accountingApi = {
  getDashboard: () => api.get('/accounting/dashboard'),
  getTransactions: (params) => api.get('/accounting/transactions', { params }),
  getExpenses: (params) => api.get('/accounting/expenses', { params }),
  createExpense: (data) => api.post('/accounting/expenses', data),
  getSalesReport: (params) => api.get('/accounting/reports/sales', { params }),
  getProductsReport: (params) => api.get('/accounting/reports/products', { params }),
  getInventoryReport: () => api.get('/accounting/reports/inventory'),
};

// Referral API
export const referralApi = {
  getConfig: () => api.get('/referrals/config'),
  updateConfig: (data) => api.put('/referrals/config', data),
  getMyReferrals: () => api.get('/referrals/my-referrals'),
  withdraw: (amount) => api.post('/referrals/withdraw', { amount }),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (key, value) => api.put('/settings', { key, value }),
  updateTax: (data) => api.put('/settings/tax', data),
  getCurrencies: () => api.get('/settings/currencies'),
  updateCurrencies: (enabled) => api.put('/settings/currencies', { enabled }),
};

// Wishlist API
export const wishlistApi = {
  getAll: () => api.get('/wishlist'),
  check: (productId) => api.get(`/wishlist/check/${productId}`),
  add: (productId) => api.post('/wishlist', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

// Reviews API
export const reviewsApi = {
  getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  getAll: (params) => api.get('/reviews', { params }),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Coupons API
export const couponsApi = {
  getAll: (params) => api.get('/coupons', { params }),
  getById: (id) => api.get(`/coupons/${id}`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  validate: (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
};

// Users API
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Warehouses API
export const warehousesApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

// Variants API
export const variantsApi = {
  getAll: (params) => api.get('/variants', { params }),
  create: (data) => api.post('/variants', data),
  update: (id, data) => api.put(`/variants/${id}`, data),
  delete: (id) => api.delete(`/variants/${id}`),
};

// Stock Transfer API
export const stockTransferApi = {
  getAll: (params) => api.get('/stock-transfer', { params }),
  create: (data) => api.post('/stock-transfer', data),
};

// Audit API
export const auditApi = {
  getAll: (params) => api.get('/audit', { params }),
  getStats: () => api.get('/audit/stats'),
};

// Stock Alerts API
export const stockAlertsApi = {
  getAll: (params) => api.get('/stock-alerts', { params }),
  getUnreadCount: () => api.get('/stock-alerts/unread-count'),
  markRead: (id) => api.post(`/stock-alerts/mark-read/${id}`),
  markAllRead: () => api.post('/stock-alerts/mark-all-read'),
};

// Invoice API
export const invoiceApi = {
  download: (orderId) => api.get(`/invoices/${orderId}`, { responseType: 'blob' }),
};

// Monitoring API
export const monitoringApi = {
  getHealth: () => api.get('/monitoring/health'),
  getStats: () => api.get('/monitoring/stats'),
  getBackups: () => api.get('/monitoring/backups'),
  createBackup: () => api.post('/monitoring/backups'),
  deleteBackup: (name) => api.delete(`/monitoring/backups/${name}`),
  restoreBackup: (name) => api.post(`/monitoring/backups/${name}/restore`),
};

// AI API
export const aiApi = {
  getStatus: () => api.get('/ai/status'),
  getSettings: () => api.get('/ai/settings'),
  updateSettings: (data) => api.put('/ai/settings', data),
  sendMessage: (message, sessionId) => api.post('/ai/chat', { message, sessionId }),
};

// Bulk API
export const bulkApi = {
  update: (productIds, updates) => api.post('/bulk/bulk-update', { productIds, updates }),
  delete: (productIds) => api.post('/bulk/bulk-delete', { productIds }),
  import: (products) => api.post('/bulk/import', { products }),
};

// Addresses API
export const addressesApi = {
  getAll: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

// Customers API
export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getOrders: (id, params) => api.get(`/customers/${id}/orders`, { params }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: (params) => api.get('/analytics', { params }),
};

// Auth API
export const authApi = {
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};