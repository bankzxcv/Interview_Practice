#!/usr/bin/env python3
"""Work Queue Worker with Fair Dispatch"""

import pika
import json
import time
import random

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', credentials=pika.PlainCredentials('admin', 'admin123'))
)
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True)
channel.basic_qos(prefetch_count=1)  # Fair dispatch

worker_id = random.randint(1000, 9999)

def callback(ch, method, properties, body):
    task = json.loads(body)
    print(f"\n[Worker {worker_id}] 📋 Processing task {task['id']}: {task['text']}")
    print(f"   Priority: {properties.priority}, Duration: {task['duration']}s")

    time.sleep(task['duration'])  # Simulate work

    print(f"[Worker {worker_id}] ✓ Completed task {task['id']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='task_queue', on_message_callback=callback)

print(f"🔧 Worker {worker_id} waiting for tasks...")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()
    connection.close()
