#!/bin/bash

# Verification script for PostgreSQL + pgAdmin setup

set -e

echo "======================================"
echo "PostgreSQL + pgAdmin - Verification"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml not found!${NC}"
    exit 1
fi

echo "1. Checking if services are running..."
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
    docker-compose ps
else
    echo -e "${RED}✗ Services are not running${NC}"
    echo "Run: docker-compose up -d"
    exit 1
fi

echo ""
echo "2. Checking PostgreSQL health..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not ready${NC}"
    exit 1
fi

echo ""
echo "3. Checking PostgreSQL version..."
VERSION=$(docker-compose exec -T postgres psql -U postgres -t -c "SELECT version();" | head -1)
echo -e "${GREEN}✓ PostgreSQL version: ${VERSION}${NC}"

echo ""
echo "4. Checking databases..."
DBS=$(docker-compose exec -T postgres psql -U postgres -t -c "\l" | grep -E "learning|postgres" | wc -l)
if [ "$DBS" -ge 2 ]; then
    echo -e "${GREEN}✓ Databases exist${NC}"
    docker-compose exec -T postgres psql -U postgres -c "\l"
else
    echo -e "${RED}✗ Expected databases not found${NC}"
    exit 1
fi

echo ""
echo "5. Checking tables..."
TABLES=$(docker-compose exec -T postgres psql -U postgres -d learning -t -c "\dt" | grep -E "employees|departments|projects" | wc -l)
if [ "$TABLES" -ge 3 ]; then
    echo -e "${GREEN}✓ Tables exist${NC}"
    docker-compose exec -T postgres psql -U postgres -d learning -c "\dt"
else
    echo -e "${RED}✗ Expected tables not found${NC}"
    exit 1
fi

echo ""
echo "6. Checking data..."
EMPLOYEE_COUNT=$(docker-compose exec -T postgres psql -U postgres -d learning -t -c "SELECT COUNT(*) FROM employees;" | tr -d ' ')
if [ "$EMPLOYEE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $EMPLOYEE_COUNT employees${NC}"
else
    echo -e "${RED}✗ No employees found${NC}"
    exit 1
fi

echo ""
echo "7. Checking pgAdmin..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5050 | grep -q "200"; then
    echo -e "${GREEN}✓ pgAdmin is accessible at http://localhost:5050${NC}"
else
    echo -e "${RED}✗ pgAdmin is not accessible${NC}"
    echo "Check logs: docker-compose logs pgadmin"
    exit 1
fi

echo ""
echo "8. Checking network connectivity..."
if docker-compose exec -T pgadmin ping -c 1 postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ pgAdmin can reach PostgreSQL${NC}"
else
    echo -e "${RED}✗ Network connectivity issue${NC}"
    exit 1
fi

echo ""
echo "9. Checking volumes..."
if docker volume ls | grep -q "postgres-data"; then
    VOLUME_SIZE=$(docker volume inspect postgres-data --format '{{ .Mountpoint }}' | xargs du -sh 2>/dev/null | cut -f1 || echo "unknown")
    echo -e "${GREEN}✓ postgres-data volume exists (size: $VOLUME_SIZE)${NC}"
else
    echo -e "${RED}✗ postgres-data volume not found${NC}"
fi

if docker volume ls | grep -q "pgadmin-data"; then
    echo -e "${GREEN}✓ pgadmin-data volume exists${NC}"
else
    echo -e "${RED}✗ pgadmin-data volume not found${NC}"
fi

echo ""
echo "10. Running sample query..."
RESULT=$(docker-compose exec -T postgres psql -U postgres -d learning -t -c \
    "SELECT department, COUNT(*) as count FROM employees GROUP BY department ORDER BY count DESC LIMIT 1;")
echo -e "${GREEN}✓ Sample query executed successfully${NC}"
echo "   Most common department: $RESULT"

echo ""
echo "======================================"
echo -e "${GREEN}All checks passed!${NC}"
echo "======================================"
echo ""
echo "Connection Details:"
echo "  PostgreSQL:"
echo "    Host: localhost"
echo "    Port: 5432"
echo "    Database: learning"
echo "    User: postgres"
echo ""
echo "  pgAdmin:"
echo "    URL: http://localhost:5050"
echo "    Email: admin@example.com"
echo ""
echo "Next steps:"
echo "  1. Open pgAdmin: http://localhost:5050"
echo "  2. Login with credentials from .env file"
echo "  3. Server is pre-configured as 'Local PostgreSQL'"
echo "  4. Explore the database using the Query Tool"
