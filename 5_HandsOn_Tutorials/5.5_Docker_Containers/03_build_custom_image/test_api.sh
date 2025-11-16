#!/bin/bash
# API testing script

API_URL="${1:-http://localhost:5000}"

echo "Testing API at: $API_URL"
echo ""

# Test root endpoint
echo "1. Testing root endpoint..."
curl -s "$API_URL/" | python3 -m json.tool
echo ""

# Test health endpoint
echo "2. Testing health endpoint..."
curl -s "$API_URL/health" | python3 -m json.tool
echo ""

# Create a user
echo "3. Creating a user..."
curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com"}' | python3 -m json.tool
echo ""

# Create another user
echo "4. Creating another user..."
curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@example.com"}' | python3 -m json.tool
echo ""

# List all users
echo "5. Listing all users..."
curl -s "$API_URL/users" | python3 -m json.tool
echo ""

# Get specific user
echo "6. Getting user with ID 1..."
curl -s "$API_URL/users/1" | python3 -m json.tool
echo ""

echo "API tests complete!"
