#!/usr/bin/env python3
"""
RabbitMQ Fanout Exchange Producer
Broadcasts messages to all bound queues (routing key ignored)
"""

import pika
import json
from datetime import datetime


connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

exchange_name = 'fanout_notifications'
channel.exchange_declare(exchange=exchange_name, exchange_type='fanout', durable=True)

messages = [
    {'text': 'System maintenance in 1 hour', 'type': 'notification'},
    {'text': 'New feature released', 'type': 'announcement'},
    {'text': 'Cache invalidation required', 'type': 'system'}
]

for msg in messages:
    msg['timestamp'] = datetime.now().isoformat()
    channel.basic_publish(
        exchange=exchange_name,
        routing_key='',  # Ignored for fanout
        body=json.dumps(msg)
    )
    print(f"✓ Broadcast: {msg['text']}")

connection.close()
print(f"\n📊 Broadcast {len(messages)} messages to all subscribers")
