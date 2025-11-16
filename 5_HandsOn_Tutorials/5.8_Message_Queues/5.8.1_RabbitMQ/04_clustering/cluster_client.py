#!/usr/bin/env python3
"""RabbitMQ Cluster Client - Connects to multiple nodes"""

import pika
import json
import random

# List of cluster nodes
NODES = [
    {'host': 'localhost', 'port': 5672},
    {'host': 'localhost', 'port': 5673},
    {'host': 'localhost', 'port': 5674}
]

def get_connection():
    """Try connecting to cluster nodes"""
    credentials = pika.PlainCredentials('admin', 'admin123')

    for node in NODES:
        try:
            params = pika.ConnectionParameters(
                host=node['host'],
                port=node['port'],
                credentials=credentials
            )
            connection = pika.BlockingConnection(params)
            print(f"✓ Connected to {node['host']}:{node['port']}")
            return connection
        except Exception as e:
            print(f"✗ Failed to connect to {node['host']}:{node['port']}")
            continue

    raise Exception("Could not connect to any cluster node")

# Send messages
connection = get_connection()
channel = connection.channel()
channel.queue_declare(queue='cluster_queue', durable=True)

for i in range(10):
    msg = {'id': i, 'text': f'Message {i}'}
    channel.basic_publish(
        exchange='',
        routing_key='cluster_queue',
        body=json.dumps(msg),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print(f"✓ Sent message {i}")

connection.close()
print("\n📊 Messages sent to cluster")
