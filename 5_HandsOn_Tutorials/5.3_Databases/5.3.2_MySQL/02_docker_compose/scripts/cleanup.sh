#!/bin/bash

echo "Cleaning up MySQL docker-compose environment..."

# Stop and remove containers and volumes
docker-compose down -v

# Remove network if it exists
docker network rm mysql-dev-network 2>/dev/null || true

echo "Cleanup completed!"
