#!/bin/bash

# Cleanup script for MySQL basic setup tutorial

echo "Cleaning up MySQL basic setup..."

# Stop and remove containers
docker-compose down -v

# Remove any orphaned containers
docker container prune -f

# Remove orphaned volumes
docker volume prune -f

echo "Cleanup completed successfully!"
