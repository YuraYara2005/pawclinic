# PawClinic Backend - Quick Start Guide

Get the PawClinic backend up and running in 5 minutes!

## Prerequisites
- Node.js 16+ installed
- MySQL 5.7+ installed and running
- Git (optional, for cloning)

## Step 1: Install Dependencies
```bash
cd pawclinic-backend
npm install
```

## Step 2: Set Up Database
```bash
# Login to MySQL
mysql -u root -p

# Run the schema
mysql -u root -p < database/schema.sql

# Verify tables
mysql -u root -p pawclinic -e "SHOW TABLES;"
```

Expected output:
```
+---------------------+
| Tables_in_pawclinic |
+---------------------+
| appointments        |
| inventory           |
| owners              |
| pets                |
| users               |
+---------------------+
```

## Step 3: Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Minimum required changes:
```env
DB_PASSWORD=your_mysql_root_password
JWT_SECRET=generate_a_random_64_char_string
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 4: Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

Expected output:
```
✅ Database connected successfully

╔═══════════════════════════════════════════════╗
║   🐾 PawClinic Veterinary Management System   ║
╚═══════════════════════════════════════════════╝

Server running in development mode
Port: 5000
Database: pawclinic

Available Routes:
  GET    /health
  POST   /api/auth/login
  GET    /api/auth/me
  ...
```

## Step 5: Test the API

### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "PawClinic API is running",
  "timestamp": "2024-12-19T..."
}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@pawclinic.com",
      "role": "admin",
      "name": "Admin User",
      "phone": "1234567890"
    }
  }
}
```

### Test Protected Endpoint
```bash
# Replace YOUR_TOKEN with the token from login response
curl -X GET http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Default Credentials

### Admin User
- **Email**: admin@pawclinic.com
- **Password**: admin123
- **Role**: admin (full access)

### Staff User
- **Email**: staff@pawclinic.com
- **Password**: staff123
- **Role**: staff (limited access)

**⚠️ IMPORTANT**: Change these passwords before deploying to production!

## Sample Data Included

The database schema includes sample data:
- 2 users (admin, staff)
- 3 pet owners
- 5 pets
- 5 appointments
- 8 inventory items

## Next Steps

1. **Read the API Documentation**
   - See `README.md` for complete API reference
   - Check `docs/API_TESTING.md` for testing guide

2. **Import Postman Collection**
   - Import `postman/PawClinic_API_Collection.json`
   - Set `base_url` to `http://localhost:5000/api`
   - Use "Login - Admin" to get JWT token

3. **Customize Configuration**
   - Review all settings in `.env`
   - Adjust rate limiting as needed
   - Configure CORS for your frontend

4. **Security Checklist**
   - Generate strong JWT_SECRET
   - Change default passwords
   - Review `docs/SECURITY.md`

## Troubleshooting

### Database Connection Failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials
mysql -u root -p -e "SELECT 1;"

# Check .env file
cat .env | grep DB_
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=5001
```

### JWT Error
```bash
# Verify JWT_SECRET is set
cat .env | grep JWT_SECRET

# Should be 64+ characters
```

### Permission Denied
```bash
# Fix file permissions
chmod -R 755 .
chmod 600 .env
```

## Development Tools

### View Logs
```bash
# Server logs (if using PM2)
pm2 logs

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Database Management
```bash
# Connect to database
mysql -u root -p pawclinic

# View all inventory
mysql -u root -p pawclinic -e "SELECT * FROM inventory;"

# View all appointments
mysql -u root -p pawclinic -e "SELECT * FROM appointments;"
```

### API Testing
Use the included test script:
```bash
# Make executable
chmod +x docs/test-api.sh

# Run tests
./docs/test-api.sh
```

## File Structure Overview

```
pawclinic-backend/
├── config/              # Database configuration
├── controllers/         # Business logic
├── middleware/          # Auth, validation, error handling
├── routes/             # API route definitions
├── database/           # SQL schema
├── docs/               # Documentation
├── postman/            # API collection
├── server.js           # Application entry point
├── package.json        # Dependencies
└── .env.example        # Environment template
```

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run security audit
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Getting Help

- **Documentation**: Check the `docs/` folder
- **API Reference**: See `README.md`
- **Security**: Review `docs/SECURITY.md`
- **Deployment**: Read `docs/DEPLOYMENT.md`

## Success Criteria

You're ready to develop when:
- ✅ Server starts without errors
- ✅ Database connection successful
- ✅ Health endpoint returns 200
- ✅ Login endpoint works
- ✅ Protected routes require authentication
- ✅ Sample data visible in responses

---

**🎉 Congratulations!** Your PawClinic backend is running!

Now you can:
1. Build your frontend application
2. Customize the business logic
3. Add more features
4. Deploy to production

For production deployment, see `docs/DEPLOYMENT.md`.
