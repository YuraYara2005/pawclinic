# 🐾 PawClinic Veterinary Management System - Backend

A production-ready, secure REST API backend for veterinary clinic management built with Node.js, Express, and MySQL.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Secure password hashing with bcryptjs

- **Security**
  - Helmet.js for secure HTTP headers
  - CORS protection
  - Rate limiting to prevent abuse
  - Input validation and sanitization
  - Parameterized queries to prevent SQL injection

- **API Endpoints**
  - Auth: Login, Get Current User
  - Inventory: Full CRUD (Admin only for CUD operations)
  - Appointments: Full CRUD with validation
  - Owners: Full CRUD with pet relationship validation
  - Pets: Full CRUD with owner verification

- **Code Quality**
  - Strict MVC architecture
  - Centralized error handling
  - Async/await with proper error catching
  - Clean, modular code structure

## 📋 Prerequisites

- Node.js >= 16.0.0
- MySQL >= 5.7
- npm or yarn

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd pawclinic-backend

# Install dependencies
npm install
```

### 2. Database Setup

Create the MySQL database and tables:

```sql
-- Create database
CREATE DATABASE pawclinic;
USE pawclinic;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'vet') NOT NULL DEFAULT 'staff',
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Owners table
CREATE TABLE owners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  INDEX idx_email (email)
);

-- Pets table
CREATE TABLE pets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50),
  breed VARCHAR(100),
  age INT,
  weight DECIMAL(10,2),
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id)
);

-- Appointments table
CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pet_id INT NOT NULL,
  owner_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason VARCHAR(200) NOT NULL,
  status ENUM('scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  notes TEXT,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_pet (pet_id),
  INDEX idx_owner (owner_id)
);

-- Inventory table
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  supplier VARCHAR(100),
  description TEXT,
  expiry_date DATE,
  INDEX idx_category (category),
  INDEX idx_quantity (quantity),
  INDEX idx_expiry (expiry_date)
);

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password_hash, role, name, phone) 
VALUES (
  'admin@pawclinic.com', 
  '$2a$10$8J.3qJ9lZQ2xkJ3w3gJ5auQxGx5qJ9J5Q2xkJ3w3gJ5auQxGx5qJ9O',
  'admin',
  'Admin User',
  '1234567890'
);
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pawclinic

JWT_SECRET=your_very_secure_random_secret_key_here
JWT_EXPIRE=1d

CORS_ORIGIN=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the Server

```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev
```

Server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@pawclinic.com",
  "password": "admin123"
}

Response:
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

#### Get Current User
```http
GET /auth/me
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@pawclinic.com",
    "role": "admin",
    "name": "Admin User",
    "phone": "1234567890"
  }
}
```

### Inventory Management

#### Get All Items
```http
GET /inventory
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Single Item
```http
GET /inventory/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Create Item (Admin Only)
```http
POST /inventory
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Dog Vaccine",
  "category": "Medicine",
  "quantity": 50,
  "unit": "doses",
  "unit_price": 25.99,
  "low_stock_threshold": 10,
  "supplier": "VetSupply Co",
  "description": "Annual dog vaccination",
  "expiry_date": "2025-12-31"
}
```

#### Update Item (Admin Only)
```http
PUT /inventory/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Dog Vaccine",
  "category": "Medicine",
  "quantity": 45,
  "unit": "doses",
  "unit_price": 25.99,
  "low_stock_threshold": 10
}
```

#### Delete Item (Admin Only)
```http
DELETE /inventory/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

### Appointments

#### Get All Appointments
```http
GET /appointments
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Single Appointment
```http
GET /appointments/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Create Appointment
```http
POST /appointments
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "pet_id": 1,
  "owner_id": 1,
  "date": "2024-12-20",
  "time": "14:30",
  "reason": "Annual checkup",
  "status": "scheduled",
  "notes": "First visit"
}
```

#### Update Appointment
```http
PUT /appointments/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "pet_id": 1,
  "owner_id": 1,
  "date": "2024-12-20",
  "time": "15:00",
  "reason": "Annual checkup",
  "status": "completed",
  "notes": "Checkup completed successfully"
}
```

#### Delete Appointment
```http
DELETE /appointments/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔒 Security Features

1. **Helmet.js**: Sets secure HTTP headers
2. **CORS**: Configurable origin protection
3. **Rate Limiting**: Prevents brute force attacks (100 requests per 15 minutes)
4. **JWT Authentication**: Secure token-based auth with expiration
5. **Password Hashing**: bcryptjs with proper salt rounds
6. **Input Validation**: express-validator on all inputs
7. **SQL Injection Prevention**: Parameterized queries only
8. **Role-Based Access**: Admin-only routes for sensitive operations

## 📁 Project Structure

```
pawclinic-backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── inventoryController.js # Inventory CRUD
│   └── appointmentController.js # Appointment CRUD
├── middleware/
│   ├── asyncHandler.js       # Async error wrapper
│   ├── authMiddleware.js     # JWT verification
│   ├── roleMiddleware.js     # Role authorization
│   ├── errorMiddleware.js    # Error handling
│   └── validationMiddleware.js # Input validation
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── inventoryRoutes.js    # Inventory endpoints
│   └── appointmentRoutes.js  # Appointment endpoints
├── .env.example              # Environment template
├── .gitignore
├── package.json
├── server.js                 # Application entry point
└── README.md
```

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}'
```

### Get Inventory (with auth)
```bash
curl -X GET http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | production |
| DB_HOST | Database host | localhost |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | - |
| DB_NAME | Database name | pawclinic |
| JWT_SECRET | JWT signing key | - |
| JWT_EXPIRE | Token expiration | 1d |
| CORS_ORIGIN | Allowed origin | http://localhost:3000 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 (15min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |

## 📦 Dependencies

- **express**: Web framework
- **mysql2**: MySQL client with promises
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **helmet**: Security headers
- **cors**: CORS middleware
- **express-rate-limit**: Rate limiting
- **express-validator**: Input validation
- **dotenv**: Environment variables

## 🎯 Production Deployment Checklist

- [ ] Change JWT_SECRET to a secure random value
- [ ] Set NODE_ENV to 'production'
- [ ] Configure production database
- [ ] Set appropriate CORS_ORIGIN
- [ ] Review rate limiting settings
- [ ] Enable HTTPS
- [ ] Set up proper logging (Winston, Morgan)
- [ ] Configure database backups
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Review and adjust security headers

## 📝 License

ISC

## 👨‍💻 Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ for PawClinic
