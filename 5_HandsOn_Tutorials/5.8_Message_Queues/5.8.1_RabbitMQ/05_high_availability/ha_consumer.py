#!/usr/bin/env python3
"""HA Consumer - Resilient to node failures"""

import pika
import json
import time

NODES = ['localhost:5672', 'localhost:5673', 'localhost:5674']

def get_connection():
    for node in NODES:
        try:
            host, port = node.split(':')
            conn = pika.BlockingConnection(
                pika.ConnectionParameters(host, int(port), credentials=pika.PlainCredentials('admin', 'admin123'))
            )
            print(f"✓ Connected to {node}")
            return conn
        except:
            continue
    raise Exception("No nodes available")

connection = get_connection()
channel = connection.channel()
channel.queue_declare(queue='quorum.orders', durable=True, arguments={'x-queue-type': 'quorum'})
channel.basic_qos(prefetch_count=1)

def callback(ch, method, properties, body):
    order = json.loads(body)
    print(f"📦 Processing order: {order['order_id']} - ${order['amount']}")
    time.sleep(0.5)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='quorum.orders', on_message_callback=callback)
print("📡 Waiting for orders (HA mode)...")

try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()
    connection.close()
