#!/usr/bin/env python3
"""Kafka Basic Consumer"""

from kafka import KafkaConsumer
import json

# Create consumer
consumer = KafkaConsumer(
    'first-topic',
    bootstrap_servers=['localhost:9092'],
    group_id='my-consumer-group',
    auto_offset_reset='earliest',  # Start from beginning
    enable_auto_commit=True,
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

print("📡 Consuming messages from 'first-topic'...")
print("   Press CTRL+C to exit\n")

try:
    for message in consumer:
        print(f"\n{'='*60}")
        print(f"📨 Received message:")
        print(f"  Topic: {message.topic}")
        print(f"  Partition: {message.partition}")
        print(f"  Offset: {message.offset}")
        print(f"  Key: {message.key.decode('utf-8') if message.key else None}")
        print(f"  Value: {message.value}")
        print(f"{'='*60}")

except KeyboardInterrupt:
    print("\n✓ Consumer stopped")
finally:
    consumer.close()
