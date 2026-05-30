# HiperCom - Quick Reference

## Local Development (Current)
```bash
# Start
start-servers.bat

# Stop
stop-servers.bat

# Restart
restart-servers.bat

# URLs
Frontend: http://localhost:5174
Backend:  http://localhost:3001
Admin:    http://localhost:5174/admin
Login:    hipercom / Hipercom123#
```

## Production (QNAP Docker)
```bash
# Deploy
docker-compose up -d

# Stop
docker-compose down

# Update
docker-compose build --no-cache && docker-compose up -d

# URLs (replace with your QNAP IP)
Frontend: http://QNAP_IP:5173
Backend:  http://QNAP_IP:3001
Admin:    http://QNAP_IP:5173/admin
```

## File Structure
```
ecomerce minimax/
├── server/                 # Backend (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   └── middleware/    # Auth, validation
│   ├── prisma/
│   │   └── schema.prisma  # Database schema (PostgreSQL)
│   ├── Dockerfile         # Server container
│   └── .env               # Server config
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/        # Customer pages
│   │   ├── admin/        # Admin pages
│   │   └── seller/       # Seller pages
│   ├── Dockerfile        # Client container (nginx)
│   └── nginx.conf        # Nginx config
├── docker-compose.yml     # Docker orchestration
├── .env.production        # Production env template
├── deploy.bat             # One-click deploy script
├── backup-db.bat          # Database backup script
└── QNAP-DEPLOY-GUIDE.md   # Full deployment guide
```

## Features Implemented
- [x] User auth (JWT, Google OAuth, password reset)
- [x] Product CRUD + variants + categories + brands
- [x] Cart + Checkout + HitPay payment
- [x] Order management + status tracking
- [x] Wishlist
- [x] Coupons/Discounts
- [x] Product Reviews & Ratings
- [x] Referral system
- [x] AI Chatbot (multiple providers)
- [x] AI Custom Instructions
- [x] Sales Dashboard + Analytics
- [x] Stock Transfer (multi-warehouse)
- [x] Email notifications (SMTP)
- [x] Admin panel (users, products, orders, accounting)
- [x] Seller panel (inventory, branches, orders)
- [x] SEO + Sitemap
- [x] Docker + PostgreSQL ready

## Database
- Dev: SQLite (file-based, easy)
- Prod: PostgreSQL (concurrent, scalable)
