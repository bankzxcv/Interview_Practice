#!/usr/bin/env python3
"""Kafka Basic Producer"""

from kafka import KafkaProducer
import json
from datetime import datetime
import time

# Create producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8') if k else None,
    acks='all',  # Wait for all replicas
    retries=3
)

topic = 'first-topic'

# Send messages
for i in range(20):
    message = {
        'id': i,
        'text': f'Message {i}',
        'timestamp': datetime.now().isoformat()
    }

    # Use modulo as partition key
    key = f'key-{i % 3}'

    # Send message
    future = producer.send(
        topic,
        key=key,
        value=message
    )

    # Wait for confirmation
    record_metadata = future.get(timeout=10)

    print(f"✓ Sent: {message['text']}")
    print(f"  Partition: {record_metadata.partition}")
    print(f"  Offset: {record_metadata.offset}")

    time.sleep(0.5)

producer.flush()
producer.close()

print(f"\n📊 Sent 20 messages to topic '{topic}'")
