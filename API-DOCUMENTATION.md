# HiperCom E-Commerce API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Login
```
POST /api/auth/login
Body: { "username": "hipercom", "password": "Hipercom123#" }
Response: { "user": {...}, "token": "..." }
```

### Register
```
POST /api/auth/register
Body: { "username": "user", "email": "user@example.com", "password": "password" }
```

## Products

### List Products
```
GET /api/products?page=1&limit=20&category=electronics&sort=newest
```

### Get Product by Slug
```
GET /api/products/slug/:slug
```

### Get Product by ID
```
GET /api/products/:id
```

### Create Product (Admin/Seller)
```
POST /api/products
Body: { "name": "Product", "price": 99.99, "sku": "SKU-001", "categoryId": "...", "brandId": "..." }
```

### Update Product (Admin/Seller)
```
PUT /api/products/:id
Body: { "name": "Updated Product", "price": 89.99 }
```

### Delete Product (Admin)
```
DELETE /api/products/:id
```

## Orders

### List Orders
```
GET /api/orders?page=1&limit=20&status=pending
```

### Get Order by ID
```
GET /api/orders/:id
```

### Create Order
```
POST /api/orders
Body: { "items": [...], "deliveryType": "shipping", "addressId": "..." }
```

### Update Order Status (Admin/Seller)
```
PUT /api/orders/:id/status
Body: { "status": "shipped" }
```

### Track Order (Public)
```
GET /api/orders/track/:orderNumber
```

## Categories

### List Categories
```
GET /api/categories
```

### Get Category Tree
```
GET /api/categories/tree
```

### Get Category by Slug
```
GET /api/categories/slug/:slug
```

### Create Category (Admin)
```
POST /api/categories
Body: { "name": "Electronics", "slug": "electronics" }
```

## Brands

### List Brands
```
GET /api/brands
```

### Create Brand (Admin)
```
POST /api/brands
Body: { "name": "Samsung", "slug": "samsung" }
```

## Cart

### Get Cart
```
GET /api/cart
```

### Add to Cart
```
POST /api/cart/add
Body: { "productId": "...", "quantity": 1 }
```

### Update Cart Item
```
PUT /api/cart/:id
Body: { "quantity": 2 }
```

### Remove from Cart
```
DELETE /api/cart/:id
```

## Payments

### Create Payment
```
POST /api/payments/create/:orderId
```

### Get Payment Status
```
GET /api/payments/status/:orderId
```

### Process Refund (Admin)
```
POST /api/payments/refund/:orderId
Body: { "amount": 50, "reason": "Customer request" }
```

### List Refunds (Admin)
```
GET /api/payments/refunds?page=1&limit=20
```

## Wishlist

### Get Wishlist
```
GET /api/wishlist
```

### Add to Wishlist
```
POST /api/wishlist
Body: { "productId": "..." }
```

### Remove from Wishlist
```
DELETE /api/wishlist/:productId
```

## Reviews

### Get Product Reviews
```
GET /api/reviews/product/:productId
```

### Create Review
```
POST /api/reviews
Body: { "productId": "...", "rating": 5, "comment": "Great product!" }
```

### List All Reviews (Admin)
```
GET /api/reviews?page=1&limit=20
```

### Update Review (Admin)
```
PUT /api/reviews/:id
Body: { "isActive": false }
```

### Delete Review (Admin)
```
DELETE /api/reviews/:id
```

## Coupons

### List Coupons (Admin)
```
GET /api/coupons?page=1&limit=20
```

### Create Coupon (Admin)
```
POST /api/coupons
Body: { "code": "SAVE10", "discountType": "percentage", "discountValue": 10 }
```

### Validate Coupon
```
POST /api/coupons/validate
Body: { "code": "SAVE10", "subtotal": 100 }
```

## Customers

### List Customers (Admin)
```
GET /api/customers?page=1&limit=20
```

### Get Customer Details (Admin)
```
GET /api/customers/:id
```

### Get Customer Orders (Admin)
```
GET /api/customers/:id/orders
```

## Warehouses

### List Warehouses (Admin)
```
GET /api/warehouses
```

### Create Warehouse (Admin)
```
POST /api/warehouses
Body: { "name": "Main Warehouse", "address": "..." }
```

### Update Warehouse (Admin)
```
PUT /api/warehouses/:id
Body: { "name": "Updated Warehouse" }
```

### Delete Warehouse (Admin)
```
DELETE /api/warehouses/:id
```

## Product Variants

### List Variants
```
GET /api/variants?productId=...
```

### Create Variant (Admin/Seller)
```
POST /api/variants
Body: { "productId": "...", "variantName": "Color", "variantValue": "Red", "sku": "..." }
```

### Update Variant (Admin/Seller)
```
PUT /api/variants/:id
Body: { "variantValue": "Blue" }
```

### Delete Variant (Admin)
```
DELETE /api/variants/:id
```

## Product Stock

### List Product Stock (Admin/Seller)
```
GET /api/product-stock?productId=...&warehouseId=...
```

### Create/Update Product Stock (Admin)
```
POST /api/product-stock
Body: { "productId": "...", "warehouseId": "...", "quantity": 100 }
```

### Update Product Stock (Admin)
```
PUT /api/product-stock/:id
Body: { "quantity": 150 }
```

### Delete Product Stock (Admin)
```
DELETE /api/product-stock/:id
```

## Stock Transfer

### List Transfers (Admin/Seller)
```
GET /api/stock-transfer?page=1&limit=20
```

### Create Transfer (Admin/Seller)
```
POST /api/stock-transfer
Body: { "productId": "...", "fromWarehouseId": "...", "toWarehouseId": "...", "quantity": 10 }
```

## Bulk Operations

### Bulk Update Products (Admin)
```
POST /api/bulk/bulk-update
Body: { "productIds": ["id1", "id2"], "updates": { "price": 99.99 } }
```

### Bulk Delete Products (Admin)
```
POST /api/bulk/bulk-delete
Body: { "productIds": ["id1", "id2"] }
```

### Import Products (Admin)
```
POST /api/bulk/import
Body: { "products": [{ "name": "Product", "price": 99.99, "stock": 10 }] }
```

## Analytics

### Get Analytics Dashboard
```
GET /api/analytics?startDate=2024-01-01
```

## Accounting

### Get Dashboard
```
GET /api/accounting/dashboard
```

### List Transactions
```
GET /api/accounting/transactions?page=1&limit=20
```

### List Expenses
```
GET /api/accounting/expenses?page=1&limit=20
```

### Create Expense (Admin)
```
POST /api/accounting/expenses
Body: { "category": "Office", "amount": 100, "description": "Supplies" }
```

### Update Expense (Admin)
```
PUT /api/accounting/expenses/:id
Body: { "amount": 150 }
```

### Delete Expense (Admin)
```
DELETE /api/accounting/expenses/:id
```

## Reports

### Sales Report
```
GET /api/accounting/reports/sales?startDate=2024-01-01&groupBy=month
```

### Products Report
```
GET /api/accounting/reports/products?startDate=2024-01-01
```

### Inventory Report
```
GET /api/accounting/reports/inventory
```

## Audit Log

### List Audit Logs (Admin)
```
GET /api/audit?page=1&limit=50&entity=Product&action=CREATE
```

### Get Audit Stats (Admin)
```
GET /api/audit/stats
```

## Stock Alerts

### List Alerts (Admin/Seller)
```
GET /api/stock-alerts?page=1&limit=50&isRead=false
```

### Get Unread Count (Admin/Seller)
```
GET /api/stock-alerts/unread-count
```

### Mark Alert as Read (Admin/Seller)
```
POST /api/stock-alerts/mark-read/:id
```

### Mark All as Read (Admin/Seller)
```
POST /api/stock-alerts/mark-all-read
```

## Invoices

### Download Invoice PDF
```
GET /api/invoices/:orderId
Headers: Authorization: Bearer <token>
Response: PDF file download
```

## Monitoring

### Get System Health
```
GET /api/monitoring/health
```

### Get System Stats
```
GET /api/monitoring/stats
```

### List Backups
```
GET /api/monitoring/backups
```

### Create Backup (Admin)
```
POST /api/monitoring/backups
```

### Restore Backup (Admin)
```
POST /api/monitoring/backups/:name/restore
```

### Delete Backup (Admin)
```
DELETE /api/monitoring/backups/:name
```

## Settings

### Get All Settings
```
GET /api/settings
```

### Update Setting (Admin)
```
PUT /api/settings
Body: { "key": "site_name", "value": "HiperCom" }
```

### Update Tax Config (Admin)
```
PUT /api/settings/tax
Body: { "name": "SST", "rate": 6, "isActive": true }
```

## Addresses

### List Addresses
```
GET /api/addresses
```

### Create Address
```
POST /api/addresses
Body: { "name": "Home", "phone": "0123456789", "address": "123 Street", "city": "KL", "state": "WP", "postalCode": "50000" }
```

### Update Address
```
PUT /api/addresses/:id
Body: { "address": "456 New Street" }
```

### Delete Address
```
DELETE /api/addresses/:id
```

## AI Chat

### Send Message
```
POST /api/chat/message
Body: { "message": "What products do you have?", "sessionId": "..." }
```

### Get Chat History
```
GET /api/chat/history?sessionId=...
```

## Referrals

### Get Referral Config
```
GET /api/referrals/config
```

### Update Referral Config (Admin)
```
PUT /api/referrals/config
Body: { "referrerRewardType": "percentage", "referrerRewardValue": 5 }
```

### Get My Referrals
```
GET /api/referrals/my-referrals
```

### Withdraw Commission
```
POST /api/referrals/withdraw
Body: { "amount": 50 }
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 20 requests / 15 min |
| Login | 5 attempts / hour |
| Chat | 10 messages / minute |
| Search | 30 searches / minute |
| Other endpoints | No limit |
