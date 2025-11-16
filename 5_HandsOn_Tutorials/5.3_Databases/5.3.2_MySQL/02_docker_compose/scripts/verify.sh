#!/bin/bash

echo "Verifying MySQL docker-compose setup..."

# Check if containers are running
echo "1. Checking containers..."
docker-compose ps

# Check MySQL connectivity
echo -e "\n2. Testing MySQL connection..."
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT VERSION();"

# Check databases
echo -e "\n3. Listing databases..."
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"

# Check phpMyAdmin
echo -e "\n4. Checking phpMyAdmin..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:${PHPMYADMIN_PORT:-8080}

echo -e "\n\nVerification complete!"
