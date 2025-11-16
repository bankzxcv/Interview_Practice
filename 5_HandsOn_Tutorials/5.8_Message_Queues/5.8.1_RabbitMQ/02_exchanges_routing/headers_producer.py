#!/usr/bin/env python3
"""
RabbitMQ Headers Exchange Producer
Routes based on message headers instead of routing key
"""

import pika
import json

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

exchange_name = 'headers_exchange'
channel.exchange_declare(exchange=exchange_name, exchange_type='headers', durable=True)

messages = [
    {'headers': {'format': 'pdf', 'size': 'large'}, 'text': 'Large PDF report'},
    {'headers': {'format': 'json', 'size': 'small'}, 'text': 'JSON data'},
    {'headers': {'format': 'xml', 'size': 'medium'}, 'text': 'XML config'}
]

for msg in messages:
    channel.basic_publish(
        exchange=exchange_name,
        routing_key='',
        body=json.dumps({'text': msg['text']}),
        properties=pika.BasicProperties(headers=msg['headers'])
    )
    print(f"✓ Sent {msg['headers']}: {msg['text']}")

connection.close()
