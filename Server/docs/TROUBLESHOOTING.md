# PawClinic Backend - Troubleshooting Guide

Solutions for common issues and problems.

---

## 🚨 Critical Issues

### Issue: Server Won't Start

**Symptoms:**
```
Error: listen EADDRINUSE :::5000
```

**Solutions:**

```bash
# Check what's using port 5000
lsof -i :5000
netstat -tlnp | grep 5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm start

# Or in .env
PORT=5001
```

---

### Issue: Database Connection Failed

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Diagnosis:**

```bash
# Check MySQL is running
sudo systemctl status mysql

# Start MySQL if stopped
sudo systemctl start mysql

# Test MySQL connection
mysql -u root -p -e "SELECT 1"

# Check credentials
mysql -u pawclinic_user -p pawclinic -e "SHOW TABLES"
```

**Solutions:**

```bash
# If wrong credentials, fix .env file
cat .env | grep DB_

# If database doesn't exist
mysql -u root -p < database/schema.sql

# Verify tables exist
mysql -u pawclinic_user -p pawclinic -e "SHOW TABLES"

# Check user permissions
mysql -u root -p -e "SHOW GRANTS FOR 'pawclinic_user'@'localhost'"
```

---

### Issue: Authentication Fails

**Symptoms:**
```
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Solutions:**

```bash
# Verify user exists in database
mysql -u root -p pawclinic -e "SELECT id, email, role FROM users"

# Check if password hash is set
mysql -u root -p pawclinic -e "SELECT email, password_hash FROM users WHERE email='admin@pawclinic.com'"

# If password_hash is NULL, insert proper hash
mysql -u root -p pawclinic -e "
  UPDATE users 
  SET password_hash = '\$2a\$10\$...' 
  WHERE email='admin@pawclinic.com'
"

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}'
```

---

### Issue: JWT Token Expired

**Symptoms:**
```
{
  "success": false,
  "message": "Not authorized, token expired"
}
```

**Solutions:**

```bash
# Get new token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}' \
  | jq -r '.data.token')

# Or increase token expiration in .env
JWT_EXPIRE=7d  # 7 days instead of 1 day
```

---

## 🔍 API Issues

### Issue: 404 Not Found

**Symptoms:**
```
{
  "success": false,
  "message": "Route /api/owners not found"
}
```

**Solutions:**

```bash
# Verify routes are registered in server.js
grep "app.use.*owners" server.js

# Check file exists
ls -la routes/ownersRoutes.js

# Check route syntax is correct
cat routes/ownersRoutes.js

# Restart server
npm start
```

---

### Issue: 401 Unauthorized

**Symptoms:**
```
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

**Solutions:**

```bash
# Verify token is included in header
curl -X GET http://localhost:5000/api/owners \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check token format
echo YOUR_TOKEN | jq -R 'split(".")[1] | @base64d | fromjson'

# If token is missing/invalid, get new token first
```

---

### Issue: 400 Validation Error

**Symptoms:**
```
{
  "success": false,
  "message": "Owner name is required, Phone number is required"
}
```

**Solutions:**

```javascript
// Check validation rules in validationMiddleware.js
cat middleware/validationMiddleware.js | grep -A 10 "ownerValidation"

// Send request with required fields
curl -X POST http://localhost:5000/api/owners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "555-1234",
    "email": "john@example.com"
  }'
```

---

### Issue: 500 Internal Server Error

**Symptoms:**
```
{
  "success": false,
  "message": "Internal Server Error"
}
```

**Solutions:**

```bash
# Check application logs
pm2 logs

# Check for detailed error
pm2 logs --lines 100 | tail -50

# Check database is running
mysql -u root -p -e "SELECT 1"

# Check database has required tables
mysql -u pawclinic_user -p pawclinic -e "SHOW TABLES"

# Check for syntax errors in controller
node -c controllers/ownersController.js

# Restart with more verbose logging
NODE_ENV=development npm start
```

---

## 🗄️ Database Issues

### Issue: Foreign Key Constraint Error

**Symptoms:**
```
Error: Cannot add or update a child row: a foreign key constraint fails
```

**Solutions:**

```bash
# Check owner exists before creating pet
mysql -u root -p pawclinic -e "SELECT id FROM owners WHERE id=1"

# If owner doesn't exist, create it first
curl -X POST http://localhost:5000/api/owners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "555-1234"
  }'

# Now create pet with that owner_id
curl -X POST http://localhost:5000/api/pets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": 1,
    "name": "Fluffy",
    "species": "Cat"
  }'
```

---

### Issue: Duplicate Entry Error

**Symptoms:**
```
Error: Duplicate entry for key 'email'
```

**Solutions:**

```bash
# Check for existing email in database
mysql -u root -p pawclinic -e "
  SELECT id, email FROM users WHERE email='admin@pawclinic.com'
"

# If updating, use a different email or update existing user
curl -X PUT http://localhost:5000/api/owners/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "555-1234",
    "email": "newemail@example.com"
  }'
```

---

### Issue: Lost Database Connection

**Symptoms:**
```
Error: Protocol error: unexpected null byte
Error: read ECONNRESET
```

**Solutions:**

```bash
# Restart MySQL
sudo systemctl restart mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log

# Verify connection pool settings in config/db.js
cat config/db.js | grep -A 5 "connectionLimit"

# Increase timeout if needed
# Add to config/db.js:
// waitTimeout: 60,
// maxIdle: 30000
```

---

## 📊 Performance Issues

### Issue: Slow Response Times

**Symptoms:**
```
Response takes 5+ seconds
```

**Solutions:**

```bash
# Check database query performance
mysql -u root -p pawclinic -e "
  SET GLOBAL slow_query_log='ON';
  SET GLOBAL long_query_time=2;
  SELECT * FROM mysql.slow_log;
"

# Optimize slow tables
mysql -u root -p pawclinic -e "
  ANALYZE TABLE owners;
  ANALYZE TABLE pets;
  ANALYZE TABLE appointments;
  OPTIMIZE TABLE owners;
  OPTIMIZE TABLE pets;
  OPTIMIZE TABLE appointments;
"

# Check for missing indexes
mysql -u root -p pawclinic -e "SHOW CREATE TABLE owners\G"

# Monitor PM2 memory usage
pm2 monit

# Check CPU usage
top -bn1 | head -20
```

---

### Issue: Memory Leak

**Symptoms:**
```
Memory usage continuously increases
PM2 restarts due to max_memory_restart
```

**Solutions:**

```bash
# Check for memory leak
pm2 monitor

# Look for circular references in code
grep -r "require.*\." controllers/
grep -r "require.*\." middleware/

# Add memory limit in ecosystem.config.js
max_memory_restart: '500M',

# Increase restart interval
wait_ready: true,
listen_timeout: 10000,

# Enable clustering
instances: 4,
exec_mode: 'cluster',

# Restart PM2
pm2 restart all
```

---

## 🔐 Security Issues

### Issue: Brute Force Attacks

**Symptoms:**
```
Too many login attempts from same IP
```

**Solutions:**

```bash
# Rate limiting already enabled in server.js
# Check configuration in .env
cat .env | grep RATE_LIMIT

# Increase rate limit threshold if needed
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100     # Per window

# Or implement fail2ban
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Create /etc/fail2ban/filter.d/pawclinic.conf
# [Definition]
# failregex = "Invalid credentials" from <HOST>
# ignoreregex =

# Create /etc/fail2ban/jail.d/pawclinic.conf
# [pawclinic]
# enabled = true
# port = 5000
# filter = pawclinic
# logpath = /var/log/pawclinic/*.log
# maxretry = 5
# findtime = 600
# bantime = 3600
```

---

### Issue: SQL Injection Attempt

**Symptoms:**
```
Unusual characters in request
' OR '1'='1'
```

**Solutions:**

```bash
# All queries already use parameterized statements
# But verify no string concatenation exists
grep -r "SELECT.*+" controllers/
grep -r "INSERT.*+" controllers/
grep -r "UPDATE.*+" controllers/
grep -r "DELETE.*+" controllers/

# If found, fix immediately
# Change from:
const query = `SELECT * FROM users WHERE email = '${email}'`

# To:
const [rows] = await pool.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
)

# Test with injection attempt
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com\" OR \"1\"=\"1",
    "password": "anything"
  }'
```

---

## 📧 Integration Issues

### Issue: External Service Integration Failed

**Symptoms:**
```
Error: ENOTFOUND example.com
Error: Socket timeout
```

**Solutions:**

```bash
# Test network connectivity
ping example.com
curl -I https://api.example.com

# Check firewall rules
sudo ufw status

# Test DNS resolution
nslookup example.com
dig example.com

# Check if port 443 is open
nc -zv example.com 443

# For email service (if sending notifications)
telnet smtp.gmail.com 587
```

---

## 🐳 Docker Issues (if using Docker)

### Issue: Container Won't Start

**Symptoms:**
```
docker: Error response from daemon
Container exited with code 1
```

**Solutions:**

```bash
# Check logs
docker logs <container_id>

# Run with verbose output
docker run -it pawclinic npm start

# Check environment variables
docker exec <container_id> env

# Rebuild image
docker build -t pawclinic .

# Check Docker file for errors
cat Dockerfile
```

---

## 🔄 Sync Issues

### Issue: Data Inconsistency

**Symptoms:**
```
Missing data or conflicting information
```

**Solutions:**

```bash
# Verify referential integrity
mysql -u root -p pawclinic -e "
  SELECT a.*, p.id FROM appointments a
  LEFT JOIN pets p ON a.pet_id = p.id
  WHERE p.id IS NULL;
"

# Fix orphaned records
mysql -u root -p pawclinic -e "
  DELETE FROM appointments 
  WHERE pet_id NOT IN (SELECT id FROM pets);
"

# Restore from backup if needed
mysql -u root -p pawclinic < backup_2024-12-19.sql
```

---

## ✅ Verification Checklist

After fixing issues, verify:

```bash
# 1. Server starts without errors
npm start

# 2. Health check responds
curl http://localhost:5000/health

# 3. Login works
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}'

# 4. Endpoints work
curl -X GET http://localhost:5000/api/owners \
  -H "Authorization: Bearer $TOKEN"

# 5. Database stable
mysql -u pawclinic_user -p pawclinic -e "SELECT COUNT(*) FROM owners"

# 6. No errors in logs
pm2 logs | grep -i error | head -20

# 7. Response times normal
curl -w "\nTime: %{time_total}s\n" http://localhost:5000/health
```

---

## 📞 Getting Help

### When contacting support, include:

1. **Error Message** (exact text)
2. **Timestamp** (when it occurred)
3. **Steps to Reproduce**
4. **System Info:**
   ```bash
   node --version
   npm --version
   mysql --version
   uname -a
   ```
5. **Environment:**
   ```bash
   echo $NODE_ENV
   pm2 status
   ```
6. **Recent Changes:**
   - Code changes?
   - Config changes?
   - Dependency updates?
   - Infrastructure changes?

### Check These First:

- [ ] Application logs: `pm2 logs`
- [ ] Database logs: `/var/log/mysql/error.log`
- [ ] System logs: `journalctl -xe`
- [ ] Network connectivity: `ping 8.8.8.8`
- [ ] Disk space: `df -h`
- [ ] Memory usage: `free -h`

---

## 🔧 Advanced Troubleshooting

### Enable Debug Mode

```bash
# Run with debug output
DEBUG=* npm start

# Or for specific module
DEBUG=express:* npm start
```

### Test Database Connection Directly

```bash
# Node.js REPL
node

// In REPL
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'pawclinic_user',
  password: 'your_password',
  database: 'pawclinic'
});

pool.query('SELECT 1').then(console.log);
```

### Monitor in Real-time

```bash
# Terminal 1: Watch logs
pm2 logs --lines 0

# Terminal 2: Monitor system
watch -n 1 'pm2 status && echo "---" && free -h && df -h'

# Terminal 3: Make requests
while true; do
  curl http://localhost:5000/api/owners -H "Authorization: Bearer $TOKEN"
  sleep 5
done
```

---

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedure
- [SECURITY.md](./SECURITY.md) - Security configuration
- [README.md](./README.md) - API reference
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch checklist

---

**Last Updated:** December 2024
**Version:** 1.0

Still having issues? Enable debug mode and check the logs! 🔍
