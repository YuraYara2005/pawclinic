# PawClinic Backend - Production Deployment Guide

## Table of Contents
1. [Server Requirements](#server-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Process Management](#process-management)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL/HTTPS Setup](#ssl-https-setup)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup Strategy](#backup-strategy)
11. [Troubleshooting](#troubleshooting)

---

## Server Requirements

### Minimum Specifications
- **OS**: Ubuntu 20.04 LTS or higher / CentOS 8+
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Node.js**: v16.x or higher (LTS recommended)
- **MySQL**: 5.7+ or 8.0+

### Recommended Specifications
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Load Balancer**: For high availability
- **CDN**: For static assets (if applicable)

---

## Pre-Deployment Checklist

### Security
- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Change all default passwords
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable SSL/TLS certificates
- [ ] Set up fail2ban for SSH protection
- [ ] Configure CORS for specific origins
- [ ] Review and adjust rate limiting

### Configuration
- [ ] Set NODE_ENV to 'production'
- [ ] Configure production database
- [ ] Set up environment variables
- [ ] Configure proper logging
- [ ] Set up monitoring alerts
- [ ] Plan backup strategy

### Code
- [ ] Remove console.logs (or configure proper logging)
- [ ] Run security audit: `npm audit`
- [ ] Update dependencies: `npm update`
- [ ] Test all endpoints
- [ ] Review error handling

---

## Environment Setup

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js (via NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify installation
```

### 3. Install MySQL
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### 4. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 5. Install Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
```

### 6. Configure Firewall
```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3306/tcp    # MySQL (only if remote access needed)
sudo ufw enable
sudo ufw status
```

---

## Database Setup

### 1. Secure MySQL
```bash
sudo mysql_secure_installation
```
Answer prompts:
- Set root password: **YES**
- Remove anonymous users: **YES**
- Disallow root login remotely: **YES**
- Remove test database: **YES**
- Reload privilege tables: **YES**

### 2. Create Database and User
```bash
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE pawclinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'pawclinic_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON pawclinic.* TO 'pawclinic_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT User, Host FROM mysql.user;

EXIT;
```

### 3. Import Schema
```bash
mysql -u pawclinic_user -p pawclinic < database/schema.sql
```

### 4. Verify Tables
```bash
mysql -u pawclinic_user -p pawclinic -e "SHOW TABLES;"
```

### 5. Configure MySQL for Production
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
# Performance
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M

# Security
bind-address = 127.0.0.1  # Only allow local connections
skip-name-resolve = 1

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

---

## Application Deployment

### 1. Create Application User
```bash
sudo adduser --system --group pawclinic
sudo usermod -s /bin/bash pawclinic
```

### 2. Clone/Upload Application
```bash
sudo mkdir -p /var/www/pawclinic
sudo chown pawclinic:pawclinic /var/www/pawclinic
cd /var/www/pawclinic

# Option A: Clone from Git
sudo -u pawclinic git clone https://github.com/yourorg/pawclinic-backend.git .

# Option B: Upload files via SCP/SFTP
# scp -r pawclinic-backend/* user@server:/var/www/pawclinic/
```

### 3. Install Dependencies
```bash
sudo -u pawclinic npm ci --production
```

### 4. Configure Environment
```bash
sudo -u pawclinic nano /var/www/pawclinic/.env
```

Production `.env`:
```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_USER=pawclinic_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_NAME=pawclinic

# JWT - GENERATE NEW SECRET!
JWT_SECRET=YOUR_64_CHAR_RANDOM_SECRET_HERE
JWT_EXPIRE=1d

# CORS - Set to your frontend domain
CORS_ORIGIN=https://pawclinic.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Generate secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Set Permissions
```bash
sudo chown -R pawclinic:pawclinic /var/www/pawclinic
sudo chmod 600 /var/www/pawclinic/.env  # Protect secrets
```

---

## Process Management

### 1. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'pawclinic-api',
    script: './server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/pawclinic/error.log',
    out_file: '/var/log/pawclinic/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### 2. Create Log Directory
```bash
sudo mkdir -p /var/log/pawclinic
sudo chown pawclinic:pawclinic /var/log/pawclinic
```

### 3. Start Application with PM2
```bash
cd /var/www/pawclinic
sudo -u pawclinic pm2 start ecosystem.config.js
sudo -u pawclinic pm2 save
```

### 4. Enable PM2 Startup
```bash
sudo pm2 startup systemd -u pawclinic --hp /home/pawclinic
```

### 5. PM2 Management Commands
```bash
# View status
pm2 status

# View logs
pm2 logs pawclinic-api

# Restart
pm2 restart pawclinic-api

# Stop
pm2 stop pawclinic-api

# Monitor
pm2 monit

# Reload (zero-downtime)
pm2 reload pawclinic-api
```

---

## Nginx Configuration

### 1. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/pawclinic
```

```nginx
upstream pawclinic_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.pawclinic.com;  # Change to your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/pawclinic-access.log;
    error_log /var/log/nginx/pawclinic-error.log;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy settings
    location / {
        proxy_pass http://pawclinic_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://pawclinic_backend;
    }
}
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/pawclinic /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain Certificate
```bash
sudo certbot --nginx -d api.pawclinic.com
```

### 3. Auto-Renewal
Certbot installs a cron job automatically. Verify:
```bash
sudo certbot renew --dry-run
```

### 4. Updated Nginx Config (HTTPS)
Certbot will update your config, but verify it includes:
```nginx
server {
    listen 443 ssl http2;
    server_name api.pawclinic.com;

    ssl_certificate /etc/letsencrypt/live/api.pawclinic.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pawclinic.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.pawclinic.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### 1. PM2 Monitoring
```bash
# Install PM2 monitoring (optional)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 2. System Monitoring with PM2 Plus (Optional)
```bash
pm2 link [secret_key] [public_key]  # Get keys from pm2.io
```

### 3. Log Management
Install logrotate config:
```bash
sudo nano /etc/logrotate.d/pawclinic
```

```
/var/log/pawclinic/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 pawclinic pawclinic
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Monitor Disk Space
```bash
df -h
du -sh /var/log/*
```

---

## Backup Strategy

### 1. Database Backup Script
Create `/usr/local/bin/backup-pawclinic-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/pawclinic"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="pawclinic"
DB_USER="pawclinic_user"
DB_PASS="YOUR_PASSWORD"

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-pawclinic-db.sh
```

### 2. Schedule Daily Backups
```bash
sudo crontab -e
```

Add:
```
0 2 * * * /usr/local/bin/backup-pawclinic-db.sh >> /var/log/pawclinic/backup.log 2>&1
```

### 3. Application Files Backup
```bash
sudo tar -czf /var/backups/pawclinic/app_$(date +%Y%m%d).tar.gz /var/www/pawclinic
```

---

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs pawclinic-api --lines 50

# Check database connection
mysql -u pawclinic_user -p pawclinic -e "SELECT 1;"

# Check port availability
sudo netstat -tlnp | grep 5000

# Check environment variables
sudo -u pawclinic pm2 env 0
```

### High Memory Usage
```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart pawclinic-api

# Check for memory leaks
pm2 monit
```

### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log

# Test connection
mysql -u pawclinic_user -p -h localhost
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check SSL configuration
sudo nginx -t
```

---

## Performance Optimization

### 1. Enable Gzip in Nginx
Add to nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types application/json text/plain text/css application/javascript;
```

### 2. Database Optimization
```sql
-- Analyze tables
ANALYZE TABLE users, owners, pets, appointments, inventory;

-- Optimize tables
OPTIMIZE TABLE users, owners, pets, appointments, inventory;
```

### 3. Connection Pooling
Already configured in `config/db.js` with:
- Connection limit: 10
- Keep-alive enabled

---

## Security Hardening

### 1. Fail2Ban for SSH
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 2. Disable Root SSH Login
Edit `/etc/ssh/sshd_config`:
```
PermitRootLogin no
PasswordAuthentication no  # Use SSH keys only
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 3. Regular Updates
```bash
# Setup automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] SSL/HTTPS working correctly
- [ ] Database connection successful
- [ ] Authentication working
- [ ] All endpoints responding correctly
- [ ] Logs being written properly
- [ ] PM2 auto-restart working
- [ ] Backups running on schedule
- [ ] Monitoring configured
- [ ] Firewall rules active
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Error handling working
- [ ] Documentation updated

---

## Maintenance Schedule

### Daily
- Monitor application logs
- Check disk space
- Verify backups completed

### Weekly
- Review error logs
- Check performance metrics
- Update dependencies if needed

### Monthly
- Review and update security patches
- Analyze database performance
- Test disaster recovery
- Review and rotate logs

---

## Support & Resources

- Application Logs: `/var/log/pawclinic/`
- Nginx Logs: `/var/log/nginx/`
- MySQL Logs: `/var/log/mysql/`
- PM2 Status: `pm2 status`
- System Status: `systemctl status`

---

**Deployment Complete!** 🎉

Your PawClinic backend is now running in production with proper security, monitoring, and backup strategies.
