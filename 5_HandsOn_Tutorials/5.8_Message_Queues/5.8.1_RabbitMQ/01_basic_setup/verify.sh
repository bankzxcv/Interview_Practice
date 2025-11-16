#!/bin/bash

# RabbitMQ Basic Setup Verification Script

set -e

echo "🔍 RabbitMQ Basic Setup Verification"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Docker is running
echo "1. Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker is running"
else
    echo -e "${RED}✗${NC} Docker is not running"
    exit 1
fi

# Step 2: Check if RabbitMQ container is running
echo ""
echo "2. Checking RabbitMQ container..."
if docker ps | grep -q rabbitmq; then
    echo -e "${GREEN}✓${NC} RabbitMQ container is running"
    CONTAINER_ID=$(docker ps | grep rabbitmq | awk '{print $1}')
    echo "   Container ID: $CONTAINER_ID"
else
    echo -e "${RED}✗${NC} RabbitMQ container is not running"
    echo "   Run: docker-compose up -d"
    exit 1
fi

# Step 3: Check RabbitMQ health
echo ""
echo "3. Checking RabbitMQ health..."
sleep 2
if docker exec rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} RabbitMQ is healthy"
else
    echo -e "${YELLOW}⚠${NC} RabbitMQ might still be starting up..."
fi

# Step 4: Check if ports are accessible
echo ""
echo "4. Checking port accessibility..."

# Check AMQP port
if nc -z localhost 5672 2>/dev/null; then
    echo -e "${GREEN}✓${NC} AMQP port (5672) is accessible"
else
    echo -e "${RED}✗${NC} AMQP port (5672) is not accessible"
fi

# Check Management UI port
if nc -z localhost 15672 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Management UI port (15672) is accessible"
else
    echo -e "${RED}✗${NC} Management UI port (15672) is not accessible"
fi

# Step 5: Check Python dependencies
echo ""
echo "5. Checking Python dependencies..."
if python3 -c "import pika" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} pika library is installed"
else
    echo -e "${YELLOW}⚠${NC} pika library is not installed"
    echo "   Install with: pip install pika"
fi

# Step 6: Test producer
echo ""
echo "6. Testing producer..."
if python3 producer.py > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Producer executed successfully"
else
    echo -e "${RED}✗${NC} Producer failed"
fi

# Step 7: Check queue exists
echo ""
echo "7. Checking queue creation..."
sleep 1
QUEUE_INFO=$(docker exec rabbitmq rabbitmqadmin -u admin -p admin123 list queues 2>/dev/null | grep hello_queue || echo "")
if [ ! -z "$QUEUE_INFO" ]; then
    echo -e "${GREEN}✓${NC} Queue 'hello_queue' exists"
    echo "$QUEUE_INFO"
else
    echo -e "${YELLOW}⚠${NC} Queue 'hello_queue' not found"
fi

# Summary
echo ""
echo "======================================"
echo "📊 Verification Summary"
echo "======================================"
echo ""
echo "Management UI: http://localhost:15672"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Next Steps:"
echo "  1. Access Management UI to see your queue"
echo "  2. Run consumer: python3 consumer.py"
echo "  3. Run producer in another terminal to see live message flow"
echo ""
echo -e "${GREEN}✓${NC} Verification complete!"
