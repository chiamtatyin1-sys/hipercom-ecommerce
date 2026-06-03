# HiperCom Demo Script — Customer Presentation

## Before Demo
- [ ] Tunnel running: `cloudflared.exe tunnel run hipercom-api` (dedicated PowerShell window)
- [ ] Backend running: `node src/index.js` in `server/` (dedicated PowerShell window)
- [ ] Frontend running: `npm run dev` in `client/` (dedicated PowerShell window)
- [ ] Admin credentials: `hipercom` / `Hipercom123#`
- [ ] Open Chrome incognito: `http://localhost:5178`

---

## Flow 1: Browse & Discover (2 min)

1. **Landing page** — hero headline, "Shop by Category" grid, "Shop by Brand" strip, featured products
2. **Category page** — click a category; note filters (price, brand, search)
3. **Search** — type "Nike" in the search bar; see results with brand/category tags
4. **Product detail** — click a product; check images, price, stock badge, description, similar products
5. **Brand showcase** — scroll "Shop by Brand" logos are real (Samsung, Apple, Nike, Sony, etc.)

> **Talk track**: "Real brand partnerships, 36 products across 8 categories, responsive search with faceted filters."

---

## Flow 2: Authentication (2 min)

1. **Register** — click "Sign Up"; fill name, email, password — OR click **"Continue with Google"**
   - Google OAuth opens — select a Google account → redirected back logged in
2. **Login** — sign in as `hipercom` / `Hipercom123#` (admin demo)
3. **Logout** — then log back in as a fresh customer

> **Talk track**: "Google OAuth for frictionless onboarding. Role-based auth (customer, seller, admin) on every API call."

---

## Flow 3: Cart & Checkout (3 min)

1. **Add to cart** — browse to a product, click "Add to Cart" (note badge updates)
2. **Cart page** — `/cart` shows quantity, subtotal, shipping estimate, tax
3. **Checkout** — click "Checkout"; logged-in users skip login gate
   - Select address (or add new)
   - Review order summary
4. **Payment** — redirects to **HitPay** (live gateway); pay with card/FPX/duitnow
5. **Confirmation** — order confirmation with order number, status tracking

> **Talk track**: "Live HitPay payment gateway accepting cards, FPX, and DuitNow. Real-time stock deduction and order tracking."

---

## Flow 4: Admin Panel (3 min)

1. **Login** — hit `/admin` with `hipercom` / `Hipercom123#`
2. **Dashboard** — revenue chart, order stats, conversion rate, top products, recent orders
3. **Products** — add/edit/delete products; upload images (max 5), assign category/brand, set SKU/price/stock
4. **Orders** — view all orders, update status (pending → processing → shipped → delivered), download invoice
5. **Categories** — add/edit/delete categories with icon mapping
6. **Brands** — add/edit/delete brands with logo upload
7. **Users** — view/manage all users
8. **Settings** — currency (RM/USD), tax rate, shipping cost, notification config, AI settings, email SMTP

> **Talk track**: "Full admin dashboard with real-time analytics, CRUD for every entity, granular settings for tax/shipping/currency. AI settings and email templates built in."

---

## Flow 5: Seller Panel (2 min)

1. **Create seller** — from admin Users page, create a seller account
2. **Login as seller** — `/seller` with seller credentials
3. **Dashboard** — sales summary, revenue trend, product stock alerts
4. **Products** — add/edit own products with image upload; only sees own inventory (data isolation)
5. **Orders** — view orders containing own products, update fulfillment status
6. **Analytics** — bar charts for top products, sales by day
7. **Referrals** — referral codes for customer acquisition

> **Talk track**: "Multi-seller marketplace architecture — each seller sees only their own products and orders. Built-in analytics and referral system."

---

## Flow 6: Admin — Advanced Features (2 min)

1. **Coupons** — create discount codes (percentage/fixed amount, expiry, usage limits)
2. **Reviews** — approve/reject customer reviews, reply to reviews
3. **Stock Alerts** — low stock products highlighted automatically
4. **Warehouses** — manage multi-warehouse inventory
5. **API Keys** — generate API keys for third-party integrations
6. **Audit Log** — every admin action is logged with timestamp + user
7. **Reports** — sales reports, product reports, accounting exports

> **Talk track**: "Enterprise-grade features: coupon engine, review moderation, audit logging, API key management, and warehouse tracking."

---

## Flow 7: Customer Pages (1 min)

1. **FAQ** — `/faq` with accordion Q&A
2. **Terms & Conditions** — `/terms`
3. **Privacy Policy** — `/privacy`
4. **Returns Policy** — `/returns`
5. **Contact** — `/contact` with form (demo disclaimer shown)
6. **Wishlist** — add products to wishlist, move to cart

> **Talk track**: "Customer trust pages — everything a user expects from a production e-commerce site."

---

## Talking Points Summary

| Feature | Detail |
|---------|--------|
| **Tech stack** | React + Vite frontend, Node.js/Express backend, SQLite (scales to PostgreSQL) |
| **Authentication** | Google OAuth + email/password + role-based (customer/seller/admin) |
| **Payments** | HitPay live gateway — cards, FPX, DuitNow |
| **API** | RESTful with pagination, filtering, sorting |
| **Security** | Rate limiting (auth: 20/15min, login: 5/hr), CORS, input sanitization, audit logging |
| **Infrastructure** | Cloudflare Tunnel for HTTPS + CDN, deployable to Vercel + Railway |
| **AI** | AI-powered product search/settings (pluggable) |
| **Multi-tenant** | Seller data isolation, seller-specific dashboards |

---

## Quick Troubleshooting

| Symptom | Fix |
|---------|-----|
| Backend down | Open `server/` → `node src/index.js` |
| Tunnel down | `& 'C:\Users\chiam\cloudflared.exe' tunnel run hipercom-api` |
| Frontend down | Open `client/` → `npm run dev` |
| API returns 530 | Restart tunnel (it died when backend restarted) |
| Google OAuth fails | Check `GOOGLE_REDIRECT_URI` in `.env` matches Cloudflare tunnel URL |
| HitPay fails | Check `SECRET_KEY` in `.env` is the live key (not test) |