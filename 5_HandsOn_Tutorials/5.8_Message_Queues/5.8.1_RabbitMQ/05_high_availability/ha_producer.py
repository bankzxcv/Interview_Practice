#!/usr/bin/env python3
"""HA Producer - Uses Quorum Queue"""

import pika
import json
from datetime import datetime

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', 5672, credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

# Declare quorum queue for HA
channel.queue_declare(
    queue='quorum.orders',
    durable=True,
    arguments={'x-queue-type': 'quorum'}
)

# Send critical messages
for i in range(20):
    msg = {
        'order_id': f'ORD-{i:04d}',
        'amount': 100 + i * 10,
        'timestamp': datetime.now().isoformat()
    }
    channel.basic_publish(
        exchange='',
        routing_key='quorum.orders',
        body=json.dumps(msg),
        properties=pika.BasicProperties(delivery_mode=2),
        mandatory=True
    )
    print(f"✓ Order {i} sent")

connection.close()
print("\n📊 All orders sent to quorum queue")
