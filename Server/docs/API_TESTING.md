# PawClinic API Testing Guide

## Prerequisites
- Server running on http://localhost:5000
- Database populated with sample data
- Tool: cURL, Postman, or any HTTP client

## Test Credentials
- **Admin**: admin@pawclinic.com / admin123
- **Staff**: staff@pawclinic.com / staff123

---

## 1. Authentication Tests

### Test 1.1: Login with Valid Credentials
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pawclinic.com",
    "password": "admin123"
  }'
```

**Expected Response (200):**
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

### Test 1.2: Login with Invalid Credentials
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pawclinic.com",
    "password": "wrongpassword"
  }'
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Test 1.3: Get Current User
```bash
# Replace YOUR_TOKEN with actual JWT from login
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**
```json
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

### Test 1.4: Access Protected Route Without Token
```bash
curl -X GET http://localhost:5000/api/inventory
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

---

## 2. Inventory Tests

### Test 2.1: Get All Inventory Items
```bash
curl -X GET http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dog Vaccine - Rabies",
      "category": "Vaccines",
      "quantity": 50,
      "unit": "doses",
      "unit_price": "25.99",
      "low_stock_threshold": 10,
      "supplier": "VetSupply Co",
      "description": "Rabies vaccination for dogs",
      "expiry_date": "2025-06-30"
    }
  ]
}
```

### Test 2.2: Get Single Inventory Item
```bash
curl -X GET http://localhost:5000/api/inventory/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2.3: Create Inventory Item (Admin Only)
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Medication",
    "category": "Medications",
    "quantity": 100,
    "unit": "tablets",
    "unit_price": 5.99,
    "low_stock_threshold": 20,
    "supplier": "PharmaPet",
    "description": "Test medication"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 9,
    "name": "New Medication",
    "category": "Medications",
    "quantity": 100,
    "unit": "tablets",
    "unit_price": "5.99",
    "low_stock_threshold": 20,
    "supplier": "PharmaPet",
    "description": "Test medication",
    "expiry_date": null
  }
}
```

### Test 2.4: Create Inventory Item (Staff - Should Fail)
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "category": "Test",
    "quantity": 10,
    "unit": "pieces",
    "unit_price": 1.00,
    "low_stock_threshold": 5
  }'
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "User role 'staff' is not authorized to access this route"
}
```

### Test 2.5: Update Inventory Item
```bash
curl -X PUT http://localhost:5000/api/inventory/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dog Vaccine - Rabies",
    "category": "Vaccines",
    "quantity": 45,
    "unit": "doses",
    "unit_price": 26.99,
    "low_stock_threshold": 10,
    "supplier": "VetSupply Co",
    "description": "Rabies vaccination for dogs - Updated"
  }'
```

### Test 2.6: Delete Inventory Item
```bash
curl -X DELETE http://localhost:5000/api/inventory/9 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

### Test 2.7: Validation Error - Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "category": "Test"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Quantity is required, Unit is required, Unit price is required, Low stock threshold is required"
}
```

### Test 2.8: Validation Error - Invalid Data Types
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "category": "Test",
    "quantity": "not-a-number",
    "unit": "pieces",
    "unit_price": "invalid",
    "low_stock_threshold": 5
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Quantity must be a non-negative integer, Unit price must be a non-negative number"
}
```

---

## 3. Appointment Tests

### Test 3.1: Get All Appointments
```bash
curl -X GET http://localhost:5000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pet_id": 1,
      "owner_id": 1,
      "date": "2024-12-20",
      "time": "09:00:00",
      "reason": "Annual checkup",
      "status": "scheduled",
      "notes": "First visit of the year",
      "pet_name": "Max",
      "species": "Dog",
      "owner_name": "John Smith",
      "owner_phone": "555-0101"
    }
  ]
}
```

### Test 3.2: Get Single Appointment
```bash
curl -X GET http://localhost:5000/api/appointments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3.3: Create Appointment
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": 1,
    "owner_id": 1,
    "date": "2024-12-25",
    "time": "14:30",
    "reason": "Routine checkup",
    "status": "scheduled",
    "notes": "Holiday appointment"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "pet_id": 1,
    "owner_id": 1,
    "date": "2024-12-25",
    "time": "14:30:00",
    "reason": "Routine checkup",
    "status": "scheduled",
    "notes": "Holiday appointment",
    "pet_name": "Max",
    "species": "Dog",
    "owner_name": "John Smith",
    "owner_phone": "555-0101"
  }
}
```

### Test 3.4: Create Appointment - Pet Doesn't Belong to Owner
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": 1,
    "owner_id": 2,
    "date": "2024-12-25",
    "time": "14:30",
    "reason": "Checkup",
    "status": "scheduled"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Pet does not belong to specified owner"
}
```

### Test 3.5: Update Appointment
```bash
curl -X PUT http://localhost:5000/api/appointments/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": 1,
    "owner_id": 1,
    "date": "2024-12-20",
    "time": "10:00",
    "reason": "Annual checkup - Updated time",
    "status": "completed",
    "notes": "Checkup completed successfully"
  }'
```

### Test 3.6: Delete Appointment
```bash
curl -X DELETE http://localhost:5000/api/appointments/6 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3.7: Validation Error - Invalid Date Format
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": 1,
    "owner_id": 1,
    "date": "25-12-2024",
    "time": "14:30",
    "reason": "Checkup"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Date must be a valid date (YYYY-MM-DD)"
}
```

### Test 3.8: Validation Error - Invalid Time Format
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": 1,
    "owner_id": 1,
    "date": "2024-12-25",
    "time": "2:30 PM",
    "reason": "Checkup"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Time must be in HH:MM format (24-hour)"
}
```

---

## 4. Error Handling Tests

### Test 4.1: 404 - Route Not Found
```bash
curl -X GET http://localhost:5000/api/notfound \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (404):**
```json
{
  "success": false,
  "message": "Route /api/notfound not found"
}
```

### Test 4.2: Token Expiration
After token expires (default 1 day):
```bash
curl -X GET http://localhost:5000/api/inventory \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Not authorized, token expired"
}
```

### Test 4.3: Rate Limiting
Make more than 100 requests within 15 minutes:
```bash
for i in {1..101}; do
  curl -X GET http://localhost:5000/api/auth/login
done
```

**Expected Response (429) after 100 requests:**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later"
}
```

---

## 5. Security Tests

### Test 5.1: SQL Injection Prevention
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pawclinic.com OR 1=1--",
    "password": "anything"
  }'
```

**Expected Response (401):**
Should not bypass authentication

### Test 5.2: XSS Prevention
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "category": "Test",
    "quantity": 10,
    "unit": "pieces",
    "unit_price": 1.00,
    "low_stock_threshold": 5
  }'
```

**Expected Response (201):**
Script should be stored as plain text, not executed

---

## Test Summary Checklist

- [ ] All authentication tests pass
- [ ] All inventory CRUD operations work
- [ ] Role-based authorization enforced
- [ ] All appointment CRUD operations work
- [ ] Validation errors return proper messages
- [ ] Security measures block malicious input
- [ ] Rate limiting works
- [ ] Error handling returns consistent format
- [ ] Database relationships enforced
- [ ] JWT authentication secure

---

## Quick Test Script

Save as `test-api.sh`:
```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

# Login and get token
echo "Testing login..."
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Test inventory
echo -e "\nTesting inventory..."
curl -s -X GET $BASE_URL/inventory \
  -H "Authorization: Bearer $TOKEN" | jq

# Test appointments
echo -e "\nTesting appointments..."
curl -s -X GET $BASE_URL/appointments \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\nAll tests completed!"
```

Run with: `chmod +x test-api.sh && ./test-api.sh`
