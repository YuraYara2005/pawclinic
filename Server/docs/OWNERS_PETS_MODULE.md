# Owners & Pets Module Documentation

## Overview
This document covers the newly added Owners and Pets modules that extend the existing PawClinic backend system.

---

## 📦 New Files Created

### Controllers
- `controllers/ownersController.js` - Owner CRUD operations
- `controllers/petsController.js` - Pet CRUD operations

### Routes
- `routes/ownersRoutes.js` - Owner endpoints
- `routes/petsRoutes.js` - Pet endpoints

### Modified Files
- `middleware/validationMiddleware.js` - Added ownerValidation and petValidation
- `server.js` - Added new route registrations

---

## 🔗 Owners API Endpoints

### Base URL: `/api/owners`

All endpoints require authentication (JWT token).

### 1. Get All Owners
```http
GET /api/owners
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "555-0101",
      "address": "123 Main St, Anytown, ST 12345"
    }
  ]
}
```

---

### 2. Get Single Owner
```http
GET /api/owners/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "john.smith@email.com",
    "phone": "555-0101",
    "address": "123 Main St, Anytown, ST 12345"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Owner not found"
}
```

---

### 3. Create Owner
```http
POST /api/owners
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "555-0102",
  "email": "jane.doe@email.com",
  "address": "456 Oak Ave, Somewhere, ST 12346"
}
```

**Validation Rules:**
- `name` - Required, 2-100 characters
- `phone` - Required, max 20 characters
- `email` - Optional, must be valid email format
- `address` - Optional, max 500 characters

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Jane Doe",
    "email": "jane.doe@email.com",
    "phone": "555-0102",
    "address": "456 Oak Ave, Somewhere, ST 12346"
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Owner name is required, Phone number is required"
}
```

---

### 4. Update Owner
```http
PUT /api/owners/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "555-0102",
  "email": "jane.smith@email.com",
  "address": "789 Pine Rd, Elsewhere, ST 12347"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane.smith@email.com",
    "phone": "555-0102",
    "address": "789 Pine Rd, Elsewhere, ST 12347"
  }
}
```

---

### 5. Delete Owner
```http
DELETE /api/owners/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

**Business Rule - Error (400):**
```json
{
  "success": false,
  "message": "Cannot delete owner with existing pets. Delete pets first or reassign them."
}
```

---

## 🐾 Pets API Endpoints

### Base URL: `/api/pets`

All endpoints require authentication (JWT token).

### 1. Get All Pets
```http
GET /api/pets
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "owner_id": 1,
      "name": "Max",
      "species": "Dog",
      "breed": "Golden Retriever",
      "age": 5,
      "weight": 32.5,
      "owner_name": "John Smith",
      "owner_phone": "555-0101"
    }
  ]
}
```

---

### 2. Get Single Pet
```http
GET /api/pets/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "owner_id": 1,
    "name": "Max",
    "species": "Dog",
    "breed": "Golden Retriever",
    "age": 5,
    "weight": 32.5,
    "owner_name": "John Smith",
    "owner_email": "john.smith@email.com",
    "owner_phone": "555-0101",
    "owner_address": "123 Main St, Anytown, ST 12345"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Pet not found"
}
```

---

### 3. Create Pet
```http
POST /api/pets
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "owner_id": 1,
  "name": "Buddy",
  "species": "Dog",
  "breed": "Labrador",
  "age": 3,
  "weight": 28.5
}
```

**Validation Rules:**
- `name` - Required, 1-100 characters
- `owner_id` - Required, must be valid positive integer and exist in database
- `species` - Required, max 50 characters
- `breed` - Optional, max 100 characters
- `age` - Optional, integer 0-100
- `weight` - Optional, non-negative number

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "owner_id": 1,
    "name": "Buddy",
    "species": "Dog",
    "breed": "Labrador",
    "age": 3,
    "weight": 28.5,
    "owner_name": "John Smith",
    "owner_phone": "555-0101"
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Pet name is required, Owner ID is required, Species is required"
}
```

**Business Rule Error (404):**
```json
{
  "success": false,
  "message": "Owner not found"
}
```

---

### 4. Update Pet
```http
PUT /api/pets/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "owner_id": 1,
  "name": "Buddy",
  "species": "Dog",
  "breed": "Labrador Retriever",
  "age": 4,
  "weight": 30.0
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "owner_id": 1,
    "name": "Buddy",
    "species": "Dog",
    "breed": "Labrador Retriever",
    "age": 4,
    "weight": 30.0,
    "owner_name": "John Smith",
    "owner_phone": "555-0101"
  }
}
```

---

### 5. Delete Pet
```http
DELETE /api/pets/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

---

## 🧪 Testing Examples

### Test Owner Creation
```bash
# Login first to get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}' \
  | jq -r '.data.token')

# Create owner
curl -X POST http://localhost:5000/api/owners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "phone": "555-0200",
    "email": "alice@example.com",
    "address": "100 Main Street"
  }'
```

### Test Pet Creation
```bash
# Create pet (requires valid owner_id)
curl -X POST http://localhost:5000/api/pets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": 1,
    "name": "Whiskers",
    "species": "Cat",
    "breed": "Siamese",
    "age": 2,
    "weight": 4.5
  }'
```

### Test Get All Owners
```bash
curl -X GET http://localhost:5000/api/owners \
  -H "Authorization: Bearer $TOKEN"
```

### Test Get All Pets
```bash
curl -X GET http://localhost:5000/api/pets \
  -H "Authorization: Bearer $TOKEN"
```

### Test Update Owner
```bash
curl -X PUT http://localhost:5000/api/owners/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith Updated",
    "phone": "555-9999",
    "email": "john.updated@example.com",
    "address": "999 New Address"
  }'
```

### Test Delete Pet
```bash
curl -X DELETE http://localhost:5000/api/pets/6 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔒 Security Features

### Authentication
- All endpoints protected with JWT authentication
- Must include valid token in Authorization header

### Validation
- All inputs validated using express-validator
- Required fields enforced
- Data type validation (integers, floats, emails)
- Length restrictions enforced

### Business Logic
- **Owner Deletion**: Prevented if owner has pets (referential integrity)
- **Pet Creation**: Owner must exist before creating pet
- **Pet Update**: New owner must exist when changing ownership

### SQL Injection Prevention
- All queries use parameterized statements
- No string concatenation in SQL queries

---

## 📊 Database Relationships

```
owners (1) ----< (many) pets
```

- One owner can have multiple pets
- Each pet belongs to exactly one owner
- Deleting an owner is prevented if pets exist
- Deleting a pet does not affect the owner

---

## 🎯 Integration with Existing System

### Appointments Integration
The existing appointments system already references both `pet_id` and `owner_id`:

```sql
SELECT 
  a.*,
  p.name as pet_name,
  o.name as owner_name
FROM appointments a
LEFT JOIN pets p ON a.pet_id = p.id
LEFT JOIN owners o ON a.owner_id = o.id
```

This ensures complete data integrity across all modules.

---

## 🚀 Quick Start

### 1. Ensure Database Has Sample Data
The schema includes sample owners and pets:
```bash
mysql -u root -p pawclinic < database/schema.sql
```

### 2. Start Server
```bash
npm start
```

### 3. Get JWT Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}'
```

### 4. Test Endpoints
Use the token from step 3 in all subsequent requests.

---

## ✅ Validation Summary

### Owner Validation
| Field   | Required | Type   | Constraints |
|---------|----------|--------|-------------|
| name    | Yes      | String | 2-100 chars |
| phone   | Yes      | String | Max 20 chars|
| email   | No       | String | Valid email |
| address | No       | String | Max 500 chars|

### Pet Validation
| Field    | Required | Type    | Constraints |
|----------|----------|---------|-------------|
| name     | Yes      | String  | 1-100 chars |
| owner_id | Yes      | Integer | Must exist  |
| species  | Yes      | String  | Max 50 chars|
| breed    | No       | String  | Max 100 chars|
| age      | No       | Integer | 0-100       |
| weight   | No       | Float   | >= 0        |

---

## 🔧 Error Handling

All errors follow the standard format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common status codes:
- `400` - Validation error or business rule violation
- `404` - Resource not found
- `401` - Unauthorized (no/invalid token)

---

## 📝 Code Quality

### Follows Existing Patterns
- ✅ Same response format
- ✅ Same validation approach
- ✅ Same error handling
- ✅ Same code style and structure
- ✅ Parameterized queries only
- ✅ asyncHandler wrapper usage
- ✅ Consistent documentation

### Best Practices
- ✅ Clean separation of concerns
- ✅ Comprehensive validation
- ✅ Proper error messages
- ✅ Business logic validation
- ✅ Database referential integrity
- ✅ Security-first approach

---

## 🎉 Summary

**New Endpoints Added**: 10 total
- 5 Owner endpoints (GET all, GET one, POST, PUT, DELETE)
- 5 Pet endpoints (GET all, GET one, POST, PUT, DELETE)

**Files Created**: 4
**Files Modified**: 2

All modules integrated seamlessly with existing authentication, validation, and error handling systems.
