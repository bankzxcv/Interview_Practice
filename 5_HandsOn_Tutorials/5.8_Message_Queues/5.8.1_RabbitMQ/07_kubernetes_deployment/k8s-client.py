#!/usr/bin/env python3
"""RabbitMQ K8s Client Example"""

import pika
import json
import os

# Use K8s service DNS name
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq-cluster.default.svc.cluster.local')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'admin')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'admin123')

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    )
)

channel = connection.channel()
channel.queue_declare(queue='k8s_queue', durable=True)

for i in range(10):
    msg = {'id': i, 'message': f'K8s message {i}'}
    channel.basic_publish(
        exchange='',
        routing_key='k8s_queue',
        body=json.dumps(msg),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print(f"✓ Sent: {msg}")

connection.close()
print("\n📊 Messages sent to RabbitMQ on K8s")
