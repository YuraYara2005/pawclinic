#!/bin/bash

# PawClinic - Owners & Pets Module Test Script
# Tests all new endpoints for Owners and Pets modules

BASE_URL="http://localhost:5000/api"
echo "================================================"
echo "  PawClinic - Owners & Pets Module Tests"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}: $2"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAILED${NC}: $2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# 1. Login and get token
echo -e "${YELLOW}Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pawclinic.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}ERROR: Failed to get authentication token${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# ============================================
# OWNERS TESTS
# ============================================

echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}OWNERS MODULE TESTS${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""

# 2. Get All Owners
echo "Test 2: Get All Owners"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/owners \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Get all owners (200 OK)"
else
  print_result 1 "Get all owners (Expected 200, got $HTTP_CODE)"
fi
echo ""

# 3. Get Single Owner
echo "Test 3: Get Single Owner (ID: 1)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/owners/1 \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Get single owner (200 OK)"
else
  print_result 1 "Get single owner (Expected 200, got $HTTP_CODE)"
fi
echo ""

# 4. Create Owner
echo "Test 4: Create New Owner"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/owners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Owner",
    "phone": "555-TEST",
    "email": "test@example.com",
    "address": "123 Test St"
  }')
HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  print_result 0 "Create owner (201 Created)"
  NEW_OWNER_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "  Created owner ID: $NEW_OWNER_ID"
else
  print_result 1 "Create owner (Expected 201, got $HTTP_CODE)"
  NEW_OWNER_ID=""
fi
echo ""

# 5. Update Owner
if [ -n "$NEW_OWNER_ID" ]; then
  echo "Test 5: Update Owner (ID: $NEW_OWNER_ID)"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT $BASE_URL/owners/$NEW_OWNER_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Test Owner",
      "phone": "555-UPDT",
      "email": "updated@example.com",
      "address": "456 Updated St"
    }')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Update owner (200 OK)"
  else
    print_result 1 "Update owner (Expected 200, got $HTTP_CODE)"
  fi
  echo ""
fi

# 6. Validation Test - Missing Required Fields
echo "Test 6: Validation - Create Owner Without Required Fields"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/owners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "incomplete@example.com"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 400 ]; then
  print_result 0 "Validation catches missing fields (400 Bad Request)"
else
  print_result 1 "Validation test (Expected 400, got $HTTP_CODE)"
fi
echo ""

# 7. Get Non-Existent Owner
echo "Test 7: Get Non-Existent Owner (ID: 99999)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/owners/99999 \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ]; then
  print_result 0 "Non-existent owner returns 404"
else
  print_result 1 "Non-existent owner test (Expected 404, got $HTTP_CODE)"
fi
echo ""

# ============================================
# PETS TESTS
# ============================================

echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}PETS MODULE TESTS${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""

# 8. Get All Pets
echo "Test 8: Get All Pets"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/pets \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Get all pets (200 OK)"
else
  print_result 1 "Get all pets (Expected 200, got $HTTP_CODE)"
fi
echo ""

# 9. Get Single Pet
echo "Test 9: Get Single Pet (ID: 1)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/pets/1 \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Get single pet (200 OK)"
else
  print_result 1 "Get single pet (Expected 200, got $HTTP_CODE)"
fi
echo ""

# 10. Create Pet with Valid Owner
echo "Test 10: Create New Pet (with owner_id: 1)"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/pets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": 1,
    "name": "Test Pet",
    "species": "Dog",
    "breed": "Test Breed",
    "age": 3,
    "weight": 15.5
  }')
HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  print_result 0 "Create pet (201 Created)"
  NEW_PET_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "  Created pet ID: $NEW_PET_ID"
else
  print_result 1 "Create pet (Expected 201, got $HTTP_CODE)"
  NEW_PET_ID=""
fi
echo ""

# 11. Create Pet with Non-Existent Owner
echo "Test 11: Create Pet with Non-Existent Owner (owner_id: 99999)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/pets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": 99999,
    "name": "Orphan Pet",
    "species": "Cat"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ]; then
  print_result 0 "Non-existent owner validation (404 Not Found)"
else
  print_result 1 "Owner validation test (Expected 404, got $HTTP_CODE)"
fi
echo ""

# 12. Update Pet
if [ -n "$NEW_PET_ID" ]; then
  echo "Test 12: Update Pet (ID: $NEW_PET_ID)"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT $BASE_URL/pets/$NEW_PET_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "owner_id": 1,
      "name": "Updated Test Pet",
      "species": "Dog",
      "breed": "Updated Breed",
      "age": 4,
      "weight": 16.0
    }')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Update pet (200 OK)"
  else
    print_result 1 "Update pet (Expected 200, got $HTTP_CODE)"
  fi
  echo ""
fi

# 13. Validation Test - Missing Required Fields
echo "Test 13: Validation - Create Pet Without Required Fields"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/pets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"breed": "Incomplete"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 400 ]; then
  print_result 0 "Validation catches missing fields (400 Bad Request)"
else
  print_result 1 "Validation test (Expected 400, got $HTTP_CODE)"
fi
echo ""

# 14. Delete Pet
if [ -n "$NEW_PET_ID" ]; then
  echo "Test 14: Delete Pet (ID: $NEW_PET_ID)"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/pets/$NEW_PET_ID \
    -H "Authorization: Bearer $TOKEN")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Delete pet (200 OK)"
  else
    print_result 1 "Delete pet (Expected 200, got $HTTP_CODE)"
  fi
  echo ""
fi

# 15. Delete Owner (Cleanup)
if [ -n "$NEW_OWNER_ID" ]; then
  echo "Test 15: Delete Owner (ID: $NEW_OWNER_ID)"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/owners/$NEW_OWNER_ID \
    -H "Authorization: Bearer $TOKEN")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Delete owner (200 OK)"
  else
    print_result 1 "Delete owner (Expected 200, got $HTTP_CODE)"
  fi
  echo ""
fi

# ============================================
# SUMMARY
# ============================================

echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
