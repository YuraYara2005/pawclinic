# PawClinic Backend - Complete Integration Guide

## Overview
This guide shows how all modules (Auth, Inventory, Appointments, Owners, Pets) work together as a complete system.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Client Application                     │
│            (Web/Mobile Frontend)                        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│         PawClinic Backend API (Node.js/Express)         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Security Layer                        │  │
│  │  (Helmet, CORS, Rate Limiting, Auth)           │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                  │
│  ┌──────────────────┴───────────────────────────────┐  │
│  │         Middleware Pipeline                     │  │
│  │  1. Input Validation (express-validator)       │  │
│  │  2. Authentication (JWT)                       │  │
│  │  3. Authorization (Role-based)                 │  │
│  │  4. Error Handling (Centralized)               │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────┴───────────────────────────────┐  │
│  │           Module Controllers                    │  │
│  │  ┌─────────┬──────────┬────────┬────────┬─────┐  │  │
│  │  │  Auth   │Inventory │Appoint.│ Owners │ Pets│  │  │
│  │  └─────────┴──────────┴────────┴────────┴─────┘  │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────┴───────────────────────────────┐  │
│  │          Database Abstraction                   │  │
│  │  (Connection Pool, Query Execution)             │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
└─────────────────────┼─────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   MySQL Database       │
         │  (PawClinic Schema)     │
         └────────────────────────┘
```

---

## 📊 Data Model Relationships

```
                    ┌──────────────┐
                    │    USERS     │
                    │ (id, email,  │
                    │ password,    │
                    │ role, name)  │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         │                 │                 │
    ┌────▼─────┐   ┌──────▼──────┐   ┌─────▼──────┐
    │ INVENTORY │   │ APPOINTMENTS │   │   (Auth    │
    │(id, name, │   │(id, pet_id,  │   │  managed)  │
    │category,  │   │owner_id,     │   └────────────┘
    │quantity)  │   │date, time)   │
    └───────────┘   └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼─────┐   ┌──────▼──────┐
    │  OWNERS   │   │    PETS     │
    │(id, name, │   │(id, owner_  │
    │email,     │◄──┤id, name,    │
    │phone)     │   │species)     │
    └───────────┘   └─────────────┘
         │
         └─ owns multiple ─────────┘
```

### Key Relationships
1. **Owners → Pets** (1:N) - One owner has many pets
2. **Pets → Appointments** (1:N) - One pet has many appointments
3. **Owners → Appointments** (1:N) - One owner has many appointments
4. **Users** - Manages access control (JWT-based)

---

## 🔄 Common User Workflows

### Workflow 1: Register Owner with Pets

**Step 1: Authenticate**
```bash
POST /api/auth/login
{
  "email": "staff@pawclinic.com",
  "password": "staff123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 2, "role": "staff", ... }
  }
}
```

**Step 2: Create Owner**
```bash
POST /api/owners
Authorization: Bearer {token}
{
  "name": "Alice Johnson",
  "phone": "555-1234",
  "email": "alice@example.com",
  "address": "123 Pet Lane"
}

Response:
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Alice Johnson",
    ...
  }
}
```

**Step 3: Create Pet(s) for Owner**
```bash
POST /api/pets
Authorization: Bearer {token}
{
  "owner_id": 4,
  "name": "Buddy",
  "species": "Dog",
  "breed": "Labrador",
  "age": 3,
  "weight": 28.5
}

Response:
{
  "success": true,
  "data": {
    "id": 6,
    "owner_id": 4,
    "name": "Buddy",
    ...
  }
}
```

**Step 4: Schedule Appointment**
```bash
POST /api/appointments
Authorization: Bearer {token}
{
  "pet_id": 6,
  "owner_id": 4,
  "date": "2024-12-20",
  "time": "14:30",
  "reason": "Annual checkup",
  "status": "scheduled"
}

Response:
{
  "success": true,
  "data": {
    "id": 7,
    "pet_id": 6,
    "pet_name": "Buddy",
    "owner_id": 4,
    "owner_name": "Alice Johnson",
    ...
  }
}
```

---

### Workflow 2: View Owner with All Pets and Appointments

**Step 1: Get Owner Details**
```bash
GET /api/owners/4
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Alice Johnson",
    "phone": "555-1234",
    "email": "alice@example.com",
    "address": "123 Pet Lane"
  }
}
```

**Step 2: Get All Pets for Owner**
```bash
GET /api/pets
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 6,
      "owner_id": 4,
      "name": "Buddy",
      "species": "Dog",
      "owner_name": "Alice Johnson"
    },
    {
      "id": 7,
      "owner_id": 4,
      "name": "Whiskers",
      "species": "Cat",
      "owner_name": "Alice Johnson"
    }
  ]
}
```

**Step 3: Get Appointments**
```bash
GET /api/appointments
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 7,
      "pet_id": 6,
      "pet_name": "Buddy",
      "owner_id": 4,
      "owner_name": "Alice Johnson",
      "date": "2024-12-20",
      "time": "14:30",
      "reason": "Annual checkup",
      "status": "scheduled"
    }
  ]
}
```

---

### Workflow 3: Update Pet and Schedule Follow-up

**Step 1: Update Pet Information**
```bash
PUT /api/pets/6
Authorization: Bearer {token}
{
  "owner_id": 4,
  "name": "Buddy",
  "species": "Dog",
  "breed": "Labrador Retriever",
  "age": 4,
  "weight": 30.5
}

Response:
{
  "success": true,
  "data": {
    "id": 6,
    "owner_id": 4,
    "name": "Buddy",
    "age": 4,
    "weight": 30.5
  }
}
```

**Step 2: Update Appointment Status**
```bash
PUT /api/appointments/7
Authorization: Bearer {token}
{
  "pet_id": 6,
  "owner_id": 4,
  "date": "2024-12-20",
  "time": "14:30",
  "reason": "Annual checkup - Completed",
  "status": "completed",
  "notes": "Vaccinations updated, weight monitored"
}

Response:
{
  "success": true,
  "data": {
    "id": 7,
    "status": "completed",
    "notes": "Vaccinations updated..."
  }
}
```

**Step 3: Create Follow-up Appointment**
```bash
POST /api/appointments
Authorization: Bearer {token}
{
  "pet_id": 6,
  "owner_id": 4,
  "date": "2025-01-10",
  "time": "15:00",
  "reason": "Follow-up check",
  "status": "scheduled"
}
```

---

## 🔐 Authentication Flow

### How JWT Token Works

```
1. User Login
   ├─ POST /api/auth/login
   ├─ Verify email + password
   └─ Generate JWT token (1 day expiry)

2. Token Structure
   ├─ Header: { "alg": "HS256", "typ": "JWT" }
   ├─ Payload: { "id": 1, "iat": ..., "exp": ... }
   └─ Signature: HMAC-SHA256(secret)

3. Token Transmission
   ├─ Client stores token
   └─ Includes in Authorization header:
      Authorization: Bearer eyJhbGciOi...

4. Token Validation
   ├─ Middleware verifies signature
   ├─ Checks expiration
   └─ Attaches user to request

5. Protected Route Access
   ├─ Route requires protect middleware
   ├─ Middleware validates token
   └─ Request granted or denied
```

### Protected Routes Example

```javascript
// This route requires authentication
router.get('/me', protect, getMe);

// This route requires authentication + admin role
router.post('/inventory', protect, authorize('admin'), createInventory);

// This route requires authentication (any role)
router.get('/owners', protect, getAllOwners);
```

---

## 🧪 Complete Integration Test Scenario

### Test Case: Create Complete Clinic Record

```bash
# 1. LOGIN
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}' \
  | jq -r '.data.token')

# 2. CREATE OWNER
OWNER=$(curl -s -X POST http://localhost:5000/api/owners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Owner",
    "phone": "555-TEST",
    "email": "test@example.com",
    "address": "Test Address"
  }')
OWNER_ID=$(echo $OWNER | jq '.data.id')

# 3. CREATE PET
PET=$(curl -s -X POST http://localhost:5000/api/pets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"owner_id\": $OWNER_ID,
    \"name\": \"Test Pet\",
    \"species\": \"Dog\",
    \"breed\": \"Test Breed\",
    \"age\": 3,
    \"weight\": 20.0
  }")
PET_ID=$(echo $PET | jq '.data.id')

# 4. SCHEDULE APPOINTMENT
APPOINTMENT=$(curl -s -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"pet_id\": $PET_ID,
    \"owner_id\": $OWNER_ID,
    \"date\": \"2024-12-20\",
    \"time\": \"14:30\",
    \"reason\": \"Annual checkup\"
  }")
APPT_ID=$(echo $APPOINTMENT | jq '.data.id')

# 5. VERIFY INTEGRATION
echo "Created:"
echo "  Owner ID: $OWNER_ID"
echo "  Pet ID: $PET_ID"
echo "  Appointment ID: $APPT_ID"

# 6. RETRIEVE APPOINTMENT (shows all relationships)
curl -s -X GET http://localhost:5000/api/appointments/$APPT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Expected response shows:
# {
#   "success": true,
#   "data": {
#     "id": 7,
#     "pet_id": [PET_ID],
#     "pet_name": "Test Pet",
#     "owner_id": [OWNER_ID],
#     "owner_name": "Test Owner",
#     "date": "2024-12-20",
#     "time": "14:30:00",
#     "reason": "Annual checkup",
#     "status": "scheduled"
#   }
# }
```

---

## 🔍 Database Query Examples

### Find All Appointments for an Owner

```javascript
// In appointmentController.js - already implemented
const [rows] = await pool.query(
  `SELECT 
    a.*,
    p.name as pet_name,
    p.species,
    o.name as owner_name,
    o.phone as owner_phone
  FROM appointments a
  LEFT JOIN pets p ON a.pet_id = p.id
  LEFT JOIN owners o ON a.owner_id = o.id
  WHERE a.owner_id = ?
  ORDER BY a.date DESC`,
  [owner_id]
);
```

### Find All Pets with Owner Names

```javascript
// In petsController.js - already implemented
const [rows] = await pool.query(
  `SELECT 
    p.*,
    o.name as owner_name,
    o.phone as owner_phone
  FROM pets p
  LEFT JOIN owners o ON p.owner_id = o.id
  ORDER BY p.name ASC`
);
```

### Find Owner's Upcoming Appointments

```javascript
// Example custom query (can be added to appointmentController)
const [rows] = await pool.query(
  `SELECT 
    a.*,
    p.name as pet_name,
    o.name as owner_name
  FROM appointments a
  JOIN pets p ON a.pet_id = p.id
  JOIN owners o ON a.owner_id = o.id
  WHERE a.owner_id = ? 
    AND a.date >= CURDATE()
    AND a.status IN ('scheduled')
  ORDER BY a.date ASC, a.time ASC`,
  [owner_id]
);
```

---

## ✅ Business Rules & Validation

### Owner Management
| Rule | Check Point | Implementation |
|------|-------------|-----------------|
| Owner must have name | POST/PUT owner | validationMiddleware |
| Owner must have phone | POST/PUT owner | validationMiddleware |
| Email must be valid (if provided) | POST/PUT owner | validationMiddleware |
| Cannot delete owner with pets | DELETE owner | ownersController |

### Pet Management
| Rule | Check Point | Implementation |
|------|-------------|-----------------|
| Pet must have name | POST/PUT pet | validationMiddleware |
| Owner must exist | POST/PUT pet | petsController |
| Species is required | POST/PUT pet | validationMiddleware |
| Age must be 0-100 if provided | POST/PUT pet | validationMiddleware |
| Weight must be positive | POST/PUT pet | validationMiddleware |

### Appointment Management
| Rule | Check Point | Implementation |
|------|-------------|-----------------|
| Pet must exist | POST/PUT appointment | appointmentController |
| Owner must exist | POST/PUT appointment | appointmentController |
| Pet belongs to owner | POST/PUT appointment | appointmentController |
| Date must be valid | POST/PUT appointment | validationMiddleware |
| Time must be HH:MM format | POST/PUT appointment | validationMiddleware |

### Inventory Management
| Rule | Check Point | Implementation |
|------|-------------|-----------------|
| All fields required | POST/PUT inventory | validationMiddleware |
| Only admin can CUD | POST/PUT/DELETE | roleMiddleware |
| Non-negative quantities | POST/PUT inventory | validationMiddleware |

---

## 🚀 API Versioning (Future Consideration)

When you need to add features, consider:

```javascript
// Version 1 routes (current)
app.use('/api/v1/owners', ownersRoutes);
app.use('/api/v1/pets', petsRoutes);

// Version 2 routes (future)
app.use('/api/v2/owners', ownersRoutesV2);
app.use('/api/v2/pets', petsRoutesV2);
```

This allows for backward compatibility when adding features.

---

## 📈 Performance Considerations

### Database Indexing
Already optimized:
```sql
INDEX idx_owner (owner_id)  -- Pets table
INDEX idx_date (date)       -- Appointments table
INDEX idx_status (status)   -- Appointments table
```

### Connection Pooling
Configured in `config/db.js`:
```javascript
connectionLimit: 10,    -- Max 10 concurrent connections
queueLimit: 0,         -- Unlimited queue
enableKeepAlive: true, -- Reuse connections
```

### Rate Limiting
Configured in `server.js`:
```javascript
windowMs: 15 * 60 * 1000,  -- 15 minutes
max: 100,                   -- 100 requests per window
```

---

## 🔒 Security Checklist

- [x] JWT authentication on all protected routes
- [x] Password hashing with bcryptjs
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (input sanitization)
- [x] CORS configured
- [x] Rate limiting enabled
- [x] Input validation on all endpoints
- [x] Error messages don't expose internals
- [x] Database referential integrity
- [x] Role-based access control

---

## 🎯 Summary

The PawClinic backend now has:

### Modules
1. **Auth** - User login and token management
2. **Owners** - Pet owner management
3. **Pets** - Pet information management
4. **Appointments** - Scheduling with automatic joins to pets/owners
5. **Inventory** - Clinic supplies management

### Key Relationships
- Owners have Pets (1:N)
- Pets have Appointments (1:N)
- Appointments link Pets and Owners

### Security
- JWT authentication on all endpoints
- Role-based access control
- Input validation
- SQL injection prevention

### API Health
- 20+ endpoints
- Comprehensive error handling
- Consistent response format
- Automated testing

All modules work together seamlessly to provide a complete veterinary clinic management system!
