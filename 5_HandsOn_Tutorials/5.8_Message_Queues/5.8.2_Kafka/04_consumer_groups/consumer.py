#!/usr/bin/env python3
"""Consumer Group Example"""

from kafka import KafkaConsumer
import json
import sys
import os

group_id = sys.argv[1] if len(sys.argv) > 1 else 'default-group'
consumer_id = os.getpid()

consumer = KafkaConsumer(
    'events-topic',
    bootstrap_servers=['localhost:9092'],
    group_id=group_id,
    auto_offset_reset='earliest',
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

print(f"🔵 Consumer {consumer_id} in group '{group_id}'")

try:
    for msg in consumer:
        print(f"[{consumer_id}] Partition {msg.partition}: {msg.value}")
except KeyboardInterrupt:
    consumer.close()
