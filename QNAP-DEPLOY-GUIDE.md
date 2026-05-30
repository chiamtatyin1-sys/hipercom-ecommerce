# HiperCom E-Commerce - QNAP TS-664 Deployment Guide

## Prerequisites
- QNAP TS-664 with Container Station installed
- Docker Compose installed on QNAP
- Git installed (optional, for pulling updates)

## Step 1: Prepare QNAP

### Install Container Station
1. Open QNAP App Center
2. Search and install **Container Station**
3. Open Container Station, ensure Docker is running

### Install Docker Compose
SSH into your QNAP:
```bash
ssh admin@YOUR_QNAP_IP
```

Check if docker-compose is available:
```bash
docker-compose --version
```

If not installed:
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## Step 2: Transfer Project Files

### Option A: Via SMB/Network Share
1. Map QNAP shared folder to your PC
2. Copy entire project folder to QNAP (e.g., `/share/Container/hipercom`)

### Option B: Via Git
```bash
cd /share/Container
git clone <your-repo-url> hipercom
cd hipercom
```

## Step 3: Configure Environment

```bash
cd /share/Container/hipercom
cp .env.production .env
```

Edit `.env` with your values:
```bash
# IMPORTANT: Change these!
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_random_secret_string
MASTER_PASSWORD=your_admin_password
HITPAY_API_KEY=your_live_key
HITPAY_SALT=your_salt
EMAIL_PASS=your_email_password
CLIENT_URL=http://YOUR_QNAP_IP:5173
VITE_API_URL=http://YOUR_QNAP_IP:3001/api
```

## Step 4: Deploy

```bash
docker-compose up -d
```

This will:
1. Pull PostgreSQL image
2. Build server and client images
3. Start all 3 containers (db, server, client)
4. Run database migrations automatically

## Step 5: Verify

```bash
# Check all containers running
docker-compose ps

# View logs
docker-compose logs -f server

# Test endpoints
curl http://localhost:3001/api/health
curl http://localhost:5173
```

Open browser:
- **Frontend:** `http://YOUR_QNAP_IP:5173`
- **Admin:** `http://YOUR_QNAP_IP:5173/admin`
- **API:** `http://YOUR_QNAP_IP:3001/api`

Login: `hipercom` / (your MASTER_PASSWORD)

## Step 6: Seed Sample Data (Optional)

```bash
docker-compose exec server npm run db:seed
```

## Useful Commands

### View Logs
```bash
docker-compose logs -f          # All services
docker-compose logs -f server   # Server only
docker-compose logs -f db       # Database only
```

### Stop Services
```bash
docker-compose down             # Stop but keep data
docker-compose down -v          # Stop AND delete data (WARNING!)
```

### Restart
```bash
docker-compose restart          # Restart all
docker-compose restart server   # Restart server only
```

### Update Code
```bash
cd /share/Container/hipercom
git pull                        # If using git
docker-compose build --no-cache # Rebuild images
docker-compose up -d            # Restart with new code
```

### Database Backup
```bash
# Manual backup
docker exec hipercom-db pg_dump -U hipercom -d hipercom -F c -f /tmp/backup.dump
docker cp hipercom-db:/tmp/backup.dump ./hipercom_backup.dump

# Restore from backup
docker cp ./hipercom_backup.dump hipercom-db:/tmp/restore.dump
docker exec hipercom-db pg_restore -U hipercom -d hipercom -c /tmp/restore.dump
```

### Database Access (Direct)
```bash
docker exec -it hipercom-db psql -U hipercom -d hipercom
```

## Port Mapping

| Service | Container Port | Host Port | Purpose |
|---------|---------------|-----------|---------|
| Client (nginx) | 80 | 5173 | Frontend |
| Server (Node.js) | 3001 | 3001 | Backend API |
| PostgreSQL | 5432 | 5432 | Database |

## Resource Usage (Estimated)

| Container | Memory | CPU |
|-----------|--------|-----|
| PostgreSQL | ~200MB | Low |
| Server | ~150MB | Low-Medium |
| Client (nginx) | ~10MB | Minimal |
| **Total** | **~360MB** | **Low** |

QNAP TS-664 has 4GB+ RAM, so this is well within limits.

## Troubleshooting

### Container won't start
```bash
docker-compose logs server    # Check error messages
```

### Database connection failed
```bash
# Check if DB is healthy
docker-compose ps db

# Check DB logs
docker-compose logs db
```

### Port already in use
Edit `docker-compose.yml` and change the host port:
```yaml
ports:
  - "8080:80"    # Change 5173 to 8080
```

### Reset everything
```bash
docker-compose down -v          # Delete all containers + data
docker-compose up -d            # Fresh start
docker-compose exec server npm run db:seed  # Seed data
```

## Security Notes

1. **Change all default passwords** in `.env`
2. **Don't commit `.env`** to git (already in `.gitignore`)
3. **Use HTTPS** in production (consider reverse proxy like Traefik)
4. **Regular backups** - run backup script weekly
5. **Keep Docker images updated** - rebuild monthly

## Next Steps After Deploy

1. Configure your domain/DNS to point to QNAP
2. Set up HTTPS with Let's Encrypt
3. Configure email SMTP for password reset
4. Set up automated backups (cron job)
5. Monitor with QNAP Container Station dashboard
