# Development Tools Guide

This document describes the development tools available for the E-Commerce platform.

## Quick Start

```bash
# Start all servers
node server/src/dev-manager.js start

# Check server status
node server/src/dev-manager.js status

# Run database seed
node server/src/dev-manager.js seed
```

## Dev Manager (`server/src/dev-manager.js`)

A comprehensive development management tool for starting, stopping, and managing the development environment.

### Commands

| Command | Description |
|---------|-------------|
| `start` | Start all servers (backend + frontend) |
| `stop` | Stop all servers |
| `restart` | Restart all servers |
| `status` | Check server status |
| `health` | Check server health |
| `seed` | Run database seed |
| `migrate` | Run database migration |
| `push` | Push schema to database |
| `reset` | Reset database (with confirmation) |
| `test` | Run API tests |
| `generate <type> [count]` | Generate test data |
| `help` | Show help |

### Examples

```bash
# Start servers
node server/src/dev-manager.js start

# Generate 20 test products
node server/src/dev-manager.js generate products 20

# Generate 10 test orders
node server/src/dev-manager.js generate orders 10

# Reset database and seed
node server/src/dev-manager.js reset
```

## CLI Tool (`server/src/cli/index.js`)

A powerful command-line interface for database management, debugging, and testing.

### Commands

| Command | Description |
|---------|-------------|
| `user list` | List users |
| `user create <u> <e> [p] [r]` | Create user |
| `user show <id>` | Show user details |
| `order list [status]` | List orders |
| `order show <id>` | Show order details |
| `payment list` | List payments |
| `product list` | List products |
| `product low-stock` | Show low stock products |
| `db status` | Show database stats |
| `db reset` | Reset database |
| `health check` | Full system health check |
| `health orders` | Order status summary |
| `health reservations` | Show stock reservations |
| `test api` | Test API endpoints |
| `test seed` | Test seed script |
| `test db` | Test database operations |
| `generate products [count]` | Generate test products |
| `generate orders [count]` | Generate test orders |
| `generate customers [count]` | Generate test customers |
| `generate reviews [count]` | Generate test reviews |
| `debug payment <order_id>` | Debug payment issue |
| `debug order <order_id>` | Debug order issue |
| `debug user <user_id>` | Debug user issue |

### Examples

```bash
# List all users
node server/src/cli.js user list

# Check system health
node server/src/cli.js health check

# Generate test data
node server/src/cli.js generate products 20
node server/src/cli.js generate orders 10

# Test API endpoints
node server/src/cli.js test api

# Debug an order
node server/src/cli.js debug order <order_id>
```

## API Test Suite (`server/src/test-api.js`)

Automated API testing for all endpoints.

### Run Tests

```bash
node server/src/test-api.js
```

### Tests Included

- Health check
- Authentication (login, register)
- Products, Categories, Brands
- Users (admin only)
- Settings
- Orders (authenticated)
- Payments
- Refunds
- Reviews
- Coupons
- Warehouses
- Variants
- Stock Alerts
- Audit Log
- Monitoring

## Data Generator (`server/prisma/generate-data.js`)

Generate realistic test data for development.

### Run Generator

```bash
node server/prisma/generate-data.js [customers] [products] [orders] [reviews] [coupons]
```

### Examples

```bash
# Generate default test data
node server/prisma/generate-data.js

# Generate custom amounts
node server/prisma/generate-data.js 20 50 30 40 5
```

### Generated Data

- **Customers**: Realistic Malaysian names with email addresses
- **Products**: 20 product templates with realistic prices
- **Orders**: Orders with various statuses (pending, paid, processing, shipped, delivered)
- **Reviews**: 3-5 star reviews with realistic comments
- **Coupons**: Percentage and fixed discount coupons

## Code Quality Tools

### ESLint

Configuration files:
- `server/.eslintrc.json` - Server-side JavaScript rules
- `client/.eslintrc.json` - Client-side React rules

### Run Linting

```bash
# Server
cd server && npx eslint src/**/*.js

# Client
cd client && npx eslint src/**/*.{js,jsx}
```

### Prettier

Configuration files:
- `server/.prettierrc`
- `client/.prettierrc`

### Run Formatting

```bash
# Server
cd server && npx prettier --write "src/**/*.js"

# Client
cd client && npx prettier --write "src/**/*.{js,jsx}"
```

## Development Workflow

### 1. Start Development Environment

```bash
node server/src/dev-manager.js start
```

### 2. Seed Database (if needed)

```bash
node server/src/dev-manager.js seed
```

### 3. Generate Test Data

```bash
node server/src/dev-manager.js generate products 20
node server/src/dev-manager.js generate orders 10
```

### 4. Run Tests

```bash
node server/src/dev-manager.js test
```

### 5. Check Health

```bash
node server/src/dev-manager.js status
```

### 6. Debug Issues

```bash
# Check logs
node server/src/cli.js logs recent

# Debug specific order
node server/src/cli.js debug order <order_id>

# Check stock reservations
node server/src/cli.js health reservations
```

## Troubleshooting

### Server Won't Start

```bash
# Check if ports are in use
netstat -ano | findstr "3001"
netstat -ano | findstr "5173"

# Kill processes
node server/src/dev-manager.js stop
```

### Database Issues

```bash
# Check database status
node server/src/cli.js db status

# Reset and reseed
node server/src/dev-manager.js reset
```

### API Tests Failing

```bash
# Ensure server is running
node server/src/dev-manager.js status

# Run tests
node server/src/test-api.js
```

## Environment Variables

Required for development:

```env
DATABASE_URL="file:../dev.db"
JWT_SECRET="your-secret-key"
HITPAY_API_URL="https://api.sandbox.hit-pay.com"
HITPAY_API_KEY="your-hitpay-key"
HITPAY_SALT="your-hitpay-salt"
SMTP_HOST="mail.hipercom.com.my"
SMTP_PORT=465
SMTP_USER="hipercommailserver@hipercom.com.my"
SMTP_PASS="Hipercommailserver3#"
```

## Quick Reference

| Task | Command |
|------|---------|
| Start servers | `node server/src/dev-manager.js start` |
| Stop servers | `node server/src/dev-manager.js stop` |
| Check status | `node server/src/dev-manager.js status` |
| Seed database | `node server/src/dev-manager.js seed` |
| Generate data | `node server/src/dev-manager.js generate products 20` |
| Run tests | `node server/src/dev-manager.js test` |
| Health check | `node server/src/cli.js health check` |
| Debug order | `node server/src/cli.js debug order <id>` |
| Reset DB | `node server/src/dev-manager.js reset` |
