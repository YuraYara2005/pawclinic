# PawClinic Backend - Security Documentation

## Overview
This document outlines all security measures implemented in the PawClinic backend system.

---

## Table of Contents
1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [SQL Injection Prevention](#sql-injection-prevention)
5. [XSS Prevention](#xss-prevention)
6. [CSRF Protection](#csrf-protection)
7. [Rate Limiting](#rate-limiting)
8. [HTTP Security Headers](#http-security-headers)
9. [CORS Configuration](#cors-configuration)
10. [Password Security](#password-security)
11. [JWT Security](#jwt-security)
12. [Environment Variables](#environment-variables)
13. [Error Handling](#error-handling)
14. [Logging & Monitoring](#logging--monitoring)
15. [Security Best Practices](#security-best-practices)
16. [Vulnerability Assessment](#vulnerability-assessment)
17. [Incident Response](#incident-response)

---

## Security Architecture

### Defense in Depth Strategy
The application implements multiple layers of security:

1. **Network Layer**: Firewall, HTTPS, Rate Limiting
2. **Application Layer**: Input validation, Authentication, Authorization
3. **Data Layer**: Parameterized queries, Encryption at rest
4. **Infrastructure Layer**: Regular updates, Monitoring, Backups

### Security Components
```
┌─────────────────────────────────────────┐
│           Client Request                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        Rate Limiter (100/15min)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Helmet.js (Security Headers)       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         CORS Validation                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Input Validation (express-         │
│           validator)                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    JWT Authentication (if required)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Role Authorization (if required)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Business Logic                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Database (Parameterized Queries)     │
└─────────────────────────────────────────┘
```

---

## Authentication & Authorization

### JWT-Based Authentication
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Token Expiration**: Configurable (default: 24 hours)
- **Storage**: Client-side (not in cookies to prevent CSRF)
- **Transmission**: Authorization header: `Bearer <token>`

### Implementation
```javascript
// Token generation
const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE
});

// Token verification
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Role-Based Access Control (RBAC)
**Roles**:
- `admin`: Full access to all resources
- `staff`: Read access + limited write access
- `vet`: Similar to staff

**Access Matrix**:
| Resource   | GET | POST | PUT | DELETE |
|------------|-----|------|-----|--------|
| Inventory  | All | Admin| Admin| Admin |
| Appointments| All | All | All | All   |
| Auth       | All | Public| - | -     |

### Protected Routes
```javascript
// Authentication required
router.get('/inventory', protect, getAllInventory);

// Authentication + Admin role required
router.post('/inventory', protect, authorize('admin'), createInventory);
```

---

## Input Validation & Sanitization

### Validation Rules Implemented

#### Email Validation
```javascript
body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .isEmail()
  .withMessage('Please provide a valid email')
  .normalizeEmail()
```

#### Numeric Validation
```javascript
body('quantity')
  .notEmpty()
  .isInt({ min: 0 })
  .withMessage('Quantity must be a non-negative integer')
  .toInt()
```

#### Date/Time Validation
```javascript
body('date')
  .isISO8601()
  .withMessage('Date must be a valid date (YYYY-MM-DD)')
  .toDate()

body('time')
  .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  .withMessage('Time must be in HH:MM format')
```

#### String Sanitization
```javascript
body('name')
  .trim()
  .notEmpty()
  .isLength({ min: 2, max: 100 })
  .escape()  // Prevents XSS
```

### Validation Error Handling
All validation errors return:
```json
{
  "success": false,
  "message": "Quantity must be a non-negative integer, Unit price is required"
}
```

---

## SQL Injection Prevention

### Parameterized Queries
**✅ SECURE** - Always use placeholders:
```javascript
const [rows] = await pool.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

**❌ INSECURE** - Never concatenate strings:
```javascript
// NEVER DO THIS!
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### Real Examples from Codebase
```javascript
// Login - Safe from SQL injection
const [rows] = await pool.query(
  'SELECT id, email, password_hash, role, name, phone FROM users WHERE email = ?',
  [email]
);

// Create inventory - Multiple parameters, all safe
await pool.query(
  `INSERT INTO inventory 
  (name, category, quantity, unit, unit_price, low_stock_threshold, supplier, description, expiry_date) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [name, category, quantity, unit, unit_price, low_stock_threshold, supplier, description, expiry_date]
);
```

### Database Configuration
- Connection pooling limits: Prevents resource exhaustion
- Prepared statements: Used automatically by mysql2
- Least privilege: Database user has only necessary permissions

---

## XSS Prevention

### Output Encoding
- Express automatically encodes JSON responses
- HTML special characters escaped via `express-validator`

### Content Security Policy
Set via Helmet.js:
```javascript
app.use(helmet());
// Sets: Content-Security-Policy, X-XSS-Protection, etc.
```

### Input Sanitization
```javascript
body('description')
  .trim()
  .escape()  // Converts <, >, &, ', " to HTML entities
```

### Example Attack Prevention
**Attack attempt**:
```json
{
  "name": "<script>alert('XSS')</script>"
}
```

**Stored in database as**:
```
&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;
```

---

## CSRF Protection

### Token-Based Authentication (No Cookies)
- JWT stored in client (localStorage/memory)
- Transmitted via Authorization header
- Not vulnerable to CSRF (no cookies = no automatic submission)

### Additional Protection
If cookies are added in the future:
- Use `SameSite=Strict` cookie attribute
- Implement CSRF tokens for state-changing operations
- Verify `Origin` and `Referer` headers

---

## Rate Limiting

### Configuration
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});
```

### Applied To
- All API routes: `/api/*`
- Prevents brute force attacks on login
- Mitigates DoS attacks

### Bypass for Health Checks
```javascript
// Health check not rate limited
app.get('/health', (req, res) => { ... });
```

### Advanced Rate Limiting (Optional)
For production, consider:
- Different limits per endpoint
- Redis-backed rate limiting for distributed systems
- IP whitelisting for trusted sources

---

## HTTP Security Headers

### Helmet.js Implementation
```javascript
app.use(helmet());
```

### Headers Set

#### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents MIME-type sniffing.

#### X-Frame-Options
```
X-Frame-Options: SAMEORIGIN
```
Prevents clickjacking attacks.

#### X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
Enables browser XSS filter.

#### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
Forces HTTPS connections.

#### Content-Security-Policy
Restricts resource loading sources.

---

## CORS Configuration

### Production Setup
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### Multiple Origins (if needed)
```javascript
const allowedOrigins = [
  'https://pawclinic.com',
  'https://app.pawclinic.com',
  'https://admin.pawclinic.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Preflight Requests
Express handles OPTIONS requests automatically.

---

## Password Security

### Hashing with bcryptjs
```javascript
const bcrypt = require('bcryptjs');

// Hash password (salt rounds: 10)
const password_hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, password_hash);
```

### Password Requirements
Enforced via validation:
- Minimum 6 characters
- No maximum (users should use password managers)

### Best Practices
- Passwords never logged
- `password_hash` never exposed in API responses
- Use strong salt rounds (10 is secure, 12+ for high security)

### User Creation Example
```sql
-- In database schema
INSERT INTO users (email, password_hash, role, name, phone) 
VALUES (
  'admin@pawclinic.com', 
  '$2a$10$...',  -- bcrypt hash
  'admin',
  'Admin User',
  '1234567890'
);
```

---

## JWT Security

### Secret Key Requirements
- **Minimum length**: 256 bits (32 bytes)
- **Recommended**: 512 bits (64 bytes)
- **Generation**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  # Header
.
eyJpZCI6MSwiaWF0IjoxNjMwMDAwMDAwfQ    # Payload
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV    # Signature
```

### Payload Content
```json
{
  "id": 1,
  "iat": 1630000000,
  "exp": 1630086400
}
```
- Only user ID stored (minimal data)
- No sensitive information
- User details fetched on each request

### Token Expiration
- Default: 1 day (`JWT_EXPIRE=1d`)
- Configurable via environment variable
- No refresh token implemented (can be added)

### Token Verification
```javascript
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Token is valid
} catch (error) {
  if (error.name === 'TokenExpiredError') {
    // Handle expired token
  }
  if (error.name === 'JsonWebTokenError') {
    // Handle invalid token
  }
}
```

---

## Environment Variables

### Sensitive Data Protection
All secrets stored in `.env` file:
```env
JWT_SECRET=...
DB_PASSWORD=...
```

### File Permissions
```bash
chmod 600 .env  # Owner read/write only
```

### .gitignore
```
.env
.env.local
.env.production
```

### Never Commit
- API keys
- Database credentials
- JWT secrets
- Any production configuration

### Environment Variable Validation
```javascript
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required');
  process.exit(1);
}
```

---

## Error Handling

### Information Disclosure Prevention
**❌ BAD** - Exposes internal details:
```json
{
  "error": "Error: connect ECONNREFUSED 127.0.0.1:3306",
  "stack": "at TCPConnectWrap.afterConnect..."
}
```

**✅ GOOD** - Generic message:
```json
{
  "success": false,
  "message": "Database connection failed"
}
```

### Production Error Handling
```javascript
res.status(statusCode).json({
  success: false,
  message: message,
  // Stack trace only in development
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
});
```

### No SQL Error Details
MySQL errors sanitized:
```javascript
if (err.code === 'ER_DUP_ENTRY') {
  message = 'Duplicate entry. Record already exists';
  // Not: "Duplicate entry 'admin@pawclinic.com' for key 'email'"
}
```

---

## Logging & Monitoring

### What to Log
- ✅ Authentication attempts (success/failure)
- ✅ Authorization failures
- ✅ Input validation errors
- ✅ Database connection errors
- ✅ Unhandled exceptions

### What NOT to Log
- ❌ Passwords (plain or hashed)
- ❌ JWT tokens
- ❌ Credit card numbers
- ❌ Personal sensitive data

### Log Format
```javascript
console.error('Error:', {
  message: err.message,
  path: req.path,
  method: req.method,
  user: req.user?.id,
  timestamp: new Date().toISOString()
});
```

### Production Logging
Use Winston or similar:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Security Best Practices

### Development
- [ ] Never commit secrets to version control
- [ ] Use `.env` for all configuration
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Run security scans regularly
- [ ] Code review all changes

### Deployment
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Disable detailed error messages
- [ ] Enable rate limiting
- [ ] Configure proper CORS
- [ ] Use strong JWT secret
- [ ] Set up monitoring and alerting

### Database
- [ ] Use least privilege principle
- [ ] Regular backups
- [ ] Encrypt sensitive data at rest
- [ ] Use prepared statements only
- [ ] Keep MySQL updated

### Infrastructure
- [ ] Enable firewall
- [ ] Disable unnecessary services
- [ ] Regular security patches
- [ ] Use SSH keys (not passwords)
- [ ] Implement fail2ban

---

## Vulnerability Assessment

### Automated Scanning
```bash
# npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### Manual Testing Checklist
- [ ] SQL injection attempts
- [ ] XSS attacks
- [ ] Authentication bypass attempts
- [ ] Authorization escalation
- [ ] CSRF attacks
- [ ] Rate limit testing
- [ ] Input validation bypass
- [ ] Session hijacking

### Third-Party Tools
- OWASP ZAP
- Burp Suite
- Snyk
- npm audit
- SonarQube

---

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor logs for suspicious activity
   - Set up alerts for failed auth attempts
   - Monitor rate limit hits

2. **Assessment**
   - Determine scope of breach
   - Identify affected systems
   - Check data access logs

3. **Containment**
   - Revoke compromised tokens
   - Block malicious IPs
   - Disable compromised accounts

4. **Eradication**
   - Patch vulnerabilities
   - Update compromised credentials
   - Review and update security measures

5. **Recovery**
   - Restore from backups if needed
   - Verify system integrity
   - Gradually restore services

6. **Lessons Learned**
   - Document incident
   - Update security procedures
   - Implement additional protections

### Emergency Contacts
- Security team: security@pawclinic.com
- System admin: admin@pawclinic.com
- On-call: +1-XXX-XXX-XXXX

---

## Security Compliance

### Data Protection
- Minimal data collection
- Encrypted transmission (HTTPS)
- Access controls implemented
- Regular backups

### OWASP Top 10 Coverage
✅ A01:2021 – Broken Access Control  
✅ A02:2021 – Cryptographic Failures  
✅ A03:2021 – Injection  
✅ A04:2021 – Insecure Design  
✅ A05:2021 – Security Misconfiguration  
✅ A06:2021 – Vulnerable Components  
✅ A07:2021 – Identification & Authentication Failures  
✅ A08:2021 – Software & Data Integrity Failures  
✅ A09:2021 – Security Logging & Monitoring Failures  
✅ A10:2021 – Server-Side Request Forgery

---

## Security Contacts

For security issues, contact:
- **Email**: security@pawclinic.com
- **Response Time**: 24 hours
- **Responsible Disclosure**: Encouraged

---

**Last Updated**: 2024
**Review Schedule**: Quarterly
**Next Review**: Q2 2025
