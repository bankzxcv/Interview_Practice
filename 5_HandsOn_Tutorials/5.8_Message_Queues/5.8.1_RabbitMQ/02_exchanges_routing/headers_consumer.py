#!/usr/bin/env python3
"""
RabbitMQ Headers Exchange Consumer
Filters messages based on header matching
"""

import pika
import json

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

exchange_name = 'headers_exchange'
channel.exchange_declare(exchange=exchange_name, exchange_type='headers', durable=True)

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

# Bind with header criteria: x-match='any' means match any header
# x-match='all' means all headers must match
channel.queue_bind(
    exchange=exchange_name,
    queue=queue_name,
    arguments={'x-match': 'any', 'format': 'pdf', 'size': 'large'}
)

def callback(ch, method, properties, body):
    msg = json.loads(body)
    print(f"\n📨 Headers: {properties.headers}")
    print(f"   Message: {msg['text']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=False)

print("📡 Waiting for messages with matching headers (format=pdf OR size=large)...")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()
    connection.close()
