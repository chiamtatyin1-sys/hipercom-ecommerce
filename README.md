# E-Commerce Solution - HiperCom

A full-stack e-commerce solution with React frontend, Node.js backend, HitPay payment integration, AI chatbot, referral system, and comprehensive accounting.

## Features

### Customer Features
- Product catalog with categories, brands, variants
- Advanced price filtering and sorting
- Shopping cart and checkout
- HitPay payment integration (redirect + QR)
- AI-powered chatbot
- Order tracking
- Referral code system

### Seller Dashboard
- Product management (CRUD)
- Order management
- Customer management
- Analytics and reports
- Referral program configuration
- Inventory tracking

### Admin Dashboard
- User management
- Full product control
- Order oversight
- Complete accounting (revenue, expenses, profit)
- System settings

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Set up database
cd server
npx prisma migrate dev

# Start development servers
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Demo Accounts
- Master Admin: `hipercom` / `Hipercom123#`

## HitPay Setup

1. Create account at https://hitpayapp.com
2. Get API Key and Salt from Dashboard > Settings > API Keys
3. Update `.env` with your credentials

## Docker Deployment

```bash
# Update .env with production values
cp .env.example .env
# Edit .env with your values

# Start containers
npm run docker:up

# Stop
npm run docker:down
```

## Project Structure

```
ecommerce-minimax/
├── client/           # React + Vite frontend
├── server/          # Node.js + Express backend
├── docker-compose.yml
└── package.json
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Payment**: HitPay API
- **Auth**: JWT + bcrypt

## License

MIT