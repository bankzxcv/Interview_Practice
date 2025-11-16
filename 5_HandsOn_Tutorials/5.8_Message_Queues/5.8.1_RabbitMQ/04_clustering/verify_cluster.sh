#!/bin/bash

echo "🔍 RabbitMQ Cluster Verification"
echo "================================"

echo -e "\n1. Node 1 Status:"
docker exec rabbitmq1 rabbitmqctl cluster_status

echo -e "\n2. Node 2 Status:"
docker exec rabbitmq2 rabbitmqctl cluster_status

echo -e "\n3. Node 3 Status:"
docker exec rabbitmq3 rabbitmqctl cluster_status

echo -e "\n4. List queues across cluster:"
docker exec rabbitmq1 rabbitmqadmin -u admin -p admin123 list queues

echo -e "\n✓ Cluster verification complete"
echo "Management UIs:"
echo "  Node 1: http://localhost:15672"
echo "  Node 2: http://localhost:15673"
echo "  Node 3: http://localhost:15674"
