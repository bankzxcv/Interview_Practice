#!/usr/bin/env python3
"""Work Queue Producer with Priorities and TTL"""

import pika
import json
import random

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

# Declare queue with max priority and DLX
channel.queue_declare(
    queue='task_queue',
    durable=True,
    arguments={
        'x-max-priority': 10,
        'x-message-ttl': 60000,  # 60 seconds
        'x-dead-letter-exchange': 'dlx_exchange'
    }
)

tasks = [
    {'id': 1, 'text': 'Process order #1001', 'priority': 5, 'duration': 2},
    {'id': 2, 'text': 'Generate report', 'priority': 3, 'duration': 5},
    {'id': 3, 'text': 'Send email', 'priority': 1, 'duration': 1},
    {'id': 4, 'text': 'Critical: Process payment', 'priority': 10, 'duration': 3},
    {'id': 5, 'text': 'Update cache', 'priority': 2, 'duration': 1}
]

for task in tasks:
    channel.basic_publish(
        exchange='',
        routing_key='task_queue',
        body=json.dumps(task),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Persistent
            priority=task['priority']
        )
    )
    print(f"✓ Sent task {task['id']} (priority: {task['priority']}): {task['text']}")

connection.close()
print(f"\n📊 Sent {len(tasks)} tasks")
