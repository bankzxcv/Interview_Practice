#!/usr/bin/env python3
"""
RabbitMQ Fanout Exchange Consumer
Receives all broadcast messages
"""

import pika
import json
import sys

service_name = sys.argv[1] if len(sys.argv) > 1 else 'service'

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

exchange_name = 'fanout_notifications'
channel.exchange_declare(exchange=exchange_name, exchange_type='fanout', durable=True)

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue
channel.queue_bind(exchange=exchange_name, queue=queue_name)

def callback(ch, method, properties, body):
    msg = json.loads(body)
    print(f"\n[{service_name}] 📨 {msg['text']} ({msg['type']})")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=False)

print(f"📡 [{service_name}] Waiting for broadcast messages...")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()
    connection.close()
