# Deployment

## Overview

Deploy the application to production environment with Redis, database, and job workers.

## Step-by-Step Plan

### 1. Set Up Production Environment

**Requirements**:

- [ ] Production server/hosting
- [ ] PostgreSQL database
- [ ] Redis instance
- [ ] Domain/URL (if needed)

---

### 2. Configure Production Environment Variables

**File**: Production `.env` file

**Variables to Set**:

- `NODE_ENV=production`
- Database connection (production)
- `JUSTTCG_API_KEY` (production key)
- Redis connection (production)
- `APP_KEY` (production key)

**Security**:

- Use secure secret management
- Never commit `.env` file
- Use environment-specific configs

---

### 3. Set Up Production Database

**Steps**:

1. Create production database
2. Run migrations: `node ace migration:run`
3. Create initial user (via seeder or manual)
4. Verify database connection

---

### 4. Set Up Redis Instance

**Options**:

- Managed Redis service (Redis Cloud, AWS ElastiCache)
- Self-hosted Redis

**Configuration**:

- Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in production `.env`
- Test connection
- Monitor memory usage

---

### 5. Deploy Application

**Steps**:

1. Build application: `npm run build` (if needed)
2. Deploy code to server
3. Install dependencies: `npm install --production`
4. Set environment variables
5. Start application server

**Process Manager** (PM2 example):

```bash
pm2 start bin/server.js --name mythicstats
pm2 save
pm2 startup
```

---

### 6. Start Job Workers

**Steps**:

1. Start BullMQ worker: `node ace bullmq:worker`
2. Use process manager to keep worker running
3. Monitor worker health

**PM2 Example**:

```bash
pm2 start "node ace bullmq:worker" --name mythicstats-worker
pm2 save
```

---

### 7. Verify Jobs Are Running

**Checks**:

- [ ] Jobs registered in queue
- [ ] Workers processing jobs
- [ ] Jobs executing at scheduled times
- [ ] No job failures
- [ ] Rate limits working correctly

**Monitoring**:

- Check BullMQ queue stats
- Monitor application logs
- Check job execution times

---

### 8. Set Up Monitoring/Alerting

**Options**:

- Application logs
- Error tracking (Sentry, etc.)
- Uptime monitoring
- Job failure alerts

---

### 9. Set Up Backups

**Backup**:

- Database backups (regular)
- Redis data (if needed)
- Environment variables (secure storage)

---

### 10. Verify Application

**Checks**:

- [ ] Application accessible
- [ ] All pages load
- [ ] API calls work
- [ ] Jobs running
- [ ] Data syncing
- [ ] No errors in logs

---

## Completion Checklist

- [ ] Production environment set up
- [ ] Environment variables configured
- [ ] Database set up and migrated
- [ ] Redis set up and connected
- [ ] Application deployed
- [ ] Job workers running
- [ ] Jobs executing correctly
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Application verified working
