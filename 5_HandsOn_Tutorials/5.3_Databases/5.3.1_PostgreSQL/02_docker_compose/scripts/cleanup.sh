#!/bin/bash

# Cleanup script for PostgreSQL + pgAdmin Docker Compose tutorial

set -e

echo "======================================"
echo "PostgreSQL + pgAdmin - Cleanup"
echo "======================================"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found!"
    echo "Please run this script from the tutorial directory."
    exit 1
fi

echo "This will remove:"
echo "  - Docker containers (postgres-main, pgadmin-web)"
echo "  - Docker network (postgres-network)"
echo "  - Docker volumes (postgres-data, pgadmin-data)"
echo "  - ALL DATABASE DATA WILL BE LOST"
echo ""

read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Stopping and removing containers..."
docker-compose down

echo ""
echo "Removing volumes..."
docker-compose down -v

echo ""
echo "Removing dangling volumes..."
docker volume prune -f

echo ""
echo "Verifying cleanup..."
echo "Containers:"
docker-compose ps

echo ""
echo "Volumes:"
docker volume ls | grep -E 'postgres-data|pgadmin-data' || echo "  No tutorial volumes found (good!)"

echo ""
echo "======================================"
echo "Cleanup complete!"
echo "======================================"
echo ""
echo "To start fresh, run:"
echo "  docker-compose up -d"
echo ""
echo "To verify services are running:"
echo "  docker-compose ps"
echo ""
echo "To access pgAdmin:"
echo "  http://localhost:5050"
