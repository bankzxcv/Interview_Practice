#!/usr/bin/env python3
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

for i in range(100):
    producer.send('events-topic', {'event_id': i, 'data': f'Event-{i}'})
    print(f"✓ Sent event {i}")

producer.close()
