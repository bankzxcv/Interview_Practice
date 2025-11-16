#!/usr/bin/env python3
"""Dead Letter Exchange Consumer"""

import pika
import json

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

# Declare DLX and DLQ
channel.exchange_declare(exchange='dlx_exchange', exchange_type='fanout', durable=True)
channel.queue_declare(queue='dlq', durable=True)
channel.queue_bind(exchange='dlx_exchange', queue='dlq')

def callback(ch, method, properties, body):
    task = json.loads(body)
    print(f"\n💀 Dead letter received:")
    print(f"   Task: {task}")
    print(f"   Reason: {properties.headers.get('x-death', [{}])[0].get('reason', 'unknown')}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='dlq', on_message_callback=callback)

print("💀 DLX Consumer waiting for dead letters...")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()
    connection.close()
