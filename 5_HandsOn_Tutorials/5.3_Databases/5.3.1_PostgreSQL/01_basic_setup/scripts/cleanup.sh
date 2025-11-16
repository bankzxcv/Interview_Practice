#!/bin/bash

# Cleanup script for PostgreSQL Basic Setup tutorial
# This script stops and removes all containers and volumes

set -e

echo "======================================"
echo "PostgreSQL Basic Setup - Cleanup"
echo "======================================"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found!"
    echo "Please run this script from the tutorial directory."
    exit 1
fi

echo "This will remove:"
echo "  - Docker containers"
echo "  - Docker networks"
echo "  - Docker volumes (ALL DATA WILL BE LOST)"
echo ""

read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Stopping containers..."
docker-compose down -v

echo ""
echo "Verifying cleanup..."
docker-compose ps

echo ""
echo "Checking for remaining volumes..."
docker volume ls | grep postgres-basic || echo "No volumes found (good!)"

echo ""
echo "======================================"
echo "Cleanup complete!"
echo "======================================"
echo ""
echo "To start fresh, run:"
echo "  docker-compose up -d"
