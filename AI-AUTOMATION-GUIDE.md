# 🤖 AI Automation System Guide

## Overview

This e-commerce platform now features a **semi-automated AI control system** that allows AI assistants to monitor, manage, and maintain the system with minimal human intervention.

**Automation Level:** Semi-Automated (AI suggests, human approves critical actions)

---

## 🚀 Quick Start

### 1. System Status
```bash
# Check if all services are running
curl http://localhost:3001/api/ai/status
```

### 2. Upload Brand Logo (AI Auto-Processes)
```bash
# Human uploads image, AI decides where to place it
curl -X POST http://localhost:3001/api/ai/upload \
  -F "file=@/path/to/apple-logo.png"
```

**AI will:**
- Detect it's a brand logo
- Resize to 200x200
- Save to `/uploads/brands/`
- Update database (if configured)

---

## 📡 AI Endpoints

### Monitoring & Control

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/status` | GET | Complete system status |
| `/api/ai/health` | GET | Quick health check |
| `/api/ai/instructions` | GET | AI workflow instructions |
| `/api/ai/upload` | POST | Upload file for AI processing |

### Database Migrations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/migration/create` | POST | Create new migration |
| `/api/ai/migration/run` | POST | Run pending migrations |
| `/api/ai/migration/rollback` | POST | Rollback last migration |
| `/api/ai/migrations` | GET | List all migrations |

### Backups

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/backup/create` | POST | Create backup |
| `/api/ai/backup/:name/restore` | POST | Restore from backup |
| `/api/ai/backups` | GET | List all backups |

### Logging & Debugging

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/logs` | GET | Get recent logs |
| `/api/ai/stats` | GET | Get log statistics |
| `/api/ai/set-log-level` | POST | Set log level |
| `/api/monitoring/health` | GET | Detailed health check |
| `/api/monitoring/metrics` | GET | Performance metrics |

---

## 🤖 AI Workflows

### Workflow 1: Brand Logo Upload
**Human Action:** Upload image to `/api/ai/upload`  
**AI Action:** Auto-detect, resize, and place

```json
// Request
POST /api/ai/upload
Content-Type: multipart/form-data
File: brand-logo.png

// AI Processing
1. Detect file type (brand logo)
2. Resize to 200x200
3. Save to /uploads/brands/brand-logo-{timestamp}.png
4. Return processed file path

// Response
{
  "success": true,
  "file": "brand-logo.png",
  "result": {
    "destination": "/uploads/brands/brand-logo-1234567890.png",
    "action": "processed"
  }
}
```

### Workflow 2: Database Migration
**Human Action:** Request migration creation  
**AI Action:** Create migration files, human reviews SQL

```json
// Step 1: Create migration
POST /api/ai/migration/create
{
  "name": "add_wishlist_table",
  "description": "Add wishlist feature"
}

// Response
{
  "success": true,
  "migration": {
    "name": "2026-05-12T10-30-00_add_wishlist_table",
    "path": "/migrations/2026-05-12T10-30-00_add_wishlist_table"
  }
}

// Step 2: Human edits up.sql and down.sql

// Step 3: Run migration
POST /api/ai/migration/run
{
  "createBackup": true
}
```

### Workflow 3: Automated Backup Before Deploy
**Human Action:** Trigger backup  
**AI Action:** Create timestamped backup with metadata

```json
POST /api/ai/backup/create
{
  "mode": "pre-deploy",
  "description": "Before v2.0 deploy"
}

// Response
{
  "success": true,
  "backup": {
    "name": "backup_2026-05-12T10-30-00_pre-deploy",
    "size": 1234567,
    "checksum": "abc123..."
  }
}
```

---

## 📊 Monitoring Dashboard

### Real-time Health Check
```bash
curl http://localhost:3001/api/monitoring/health
```

**Returns:**
- System metrics (CPU, memory, disk)
- Database status
- Service status (email, payments, AI)
- Performance metrics

### Live Logs
```bash
# Get last 100 logs
curl http://localhost:3001/api/ai/logs?count=100

# Get ERROR level logs only
curl http://localhost:3001/api/ai/logs?level=ERROR
```

### Set Log Level
```bash
# Set to DEBUG for detailed logging
POST /api/ai/set-log-level
{
  "level": "DEBUG"
}

# Levels: ERROR, WARN, INFO, DEBUG, API, DB
```

---

## 💾 Backup & Rollback

### Create Backup
```bash
curl -X POST http://localhost:3001/api/ai/backup/create \
  -H "Content-Type: application/json" \
  -d '{"mode":"manual","description":"Before major update"}'
```

### List Backups
```bash
curl http://localhost:3001/api/ai/backups

// Response
[
  {
    "name": "backup_2026-05-12T10-30-00_pre-deploy",
    "timestamp": "2026-05-12T10:30:00.000Z",
    "mode": "pre-deploy",
    "size": 1234567,
    "checksum": "abc123..."
  }
]
```

### Restore from Backup
```bash
# Select backup to restore
curl -X POST http://localhost:3001/api/ai/backup/backup_2026-05-12T10-30-00_pre-deploy/restore

// System will:
// 1. Verify checksum
// 2. Create emergency backup of current state
// 3. Restore selected backup
// 4. Return success/failure
```

---

## 🔧 Self-Service Modes

### Customer-Facing Backup Options

The system supports multiple backup modes for different scenarios:

1. **Manual Backup** - On-demand backup before changes
2. **Auto Backup** - Scheduled automatic backups
3. **Pre-Migration Backup** - Automatic before database changes
4. **Pre-Deploy Backup** - Before code deployments

Customers can choose their preferred backup strategy via API or admin panel.

---

## 🛠️ Semi-Automated Features

### What AI Can Do Automatically:
- ✅ Process uploaded files (logos, product images)
- ✅ Create database migrations
- ✅ Run migrations with auto-backup
- ✅ Monitor system health
- ✅ Generate logs and metrics
- ✅ Create/restore backups
- ✅ Detect and categorize files

### What Requires Human Approval:
- ⚠️ Executing database migrations (AI creates, human approves)
- ⚠️ Production deployments
- ⚠️ System configuration changes
- ⚠️ Deleting backups
- ⚠️ Changing log levels in production

---

## 📈 Performance Monitoring

### View Metrics
```bash
curl http://localhost:3001/api/monitoring/metrics
```

**Returns:**
- Memory usage
- CPU load
- Uptime
- Active connections
- Database query performance

### Alerting (Future)
- Email alerts on high memory usage (>90%)
- Slack notifications on errors
- SMS on critical failures

---

## 🚨 Error Handling

### Auto-Recovery
The system automatically:
- Creates backups before risky operations
- Rolls back on migration failures
- Logs all errors with full stack traces
- Preserves old logs (up to 5 rotations)

### Manual Debugging
```bash
# View error logs
curl "http://localhost:3001/api/ai/logs?level=ERROR&count=50"

# View system stats
curl http://localhost:3001/api/ai/stats

# Check migration status
curl http://localhost:3001/api/ai/migrations
```

---

## 🎯 Next Steps (AI Suggestions)

Based on current system analysis, here are recommended enhancements:

1. **Wishlist Feature** - High user demand
2. **Coupon System** - Increase sales
3. **Product Reviews** - Build trust
4. **Sales Dashboard** - Better analytics
5. **Mobile App** - iOS/Android apps

**AI Recommendation:** Start with wishlist (Phase 2, item 1)

---

## 📞 Support

For issues or questions about AI automation:
- Check logs: `/api/ai/logs`
- View status: `/api/ai/status`
- Review migrations: `/api/ai/migrations`
- List backups: `/api/ai/backups`

**System Version:** 1.0.0  
**Automation Level:** Semi-Automated  
**Last Updated:** 2026-05-12
