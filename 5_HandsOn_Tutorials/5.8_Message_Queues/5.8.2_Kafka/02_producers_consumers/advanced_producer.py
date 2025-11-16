#!/usr/bin/env python3
"""Advanced Kafka Producer with Idempotence and Compression"""

from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
from datetime import datetime

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    acks='all',
    enable_idempotence=True,  # Exactly-once semantics
    compression_type='snappy',
    max_in_flight_requests_per_connection=5,
    retries=3,
    batch_size=16384,
    linger_ms=10
)

def on_send_success(record_metadata):
    print(f"✓ Success: topic={record_metadata.topic}, partition={record_metadata.partition}, offset={record_metadata.offset}")

def on_send_error(excp):
    print(f"✗ Error: {excp}")

# Send with callbacks
for i in range(100):
    msg = {'id': i, 'data': f'Data-{i}', 'ts': datetime.now().isoformat()}
    producer.send('advanced-topic', value=msg).add_callback(on_send_success).add_errback(on_send_error)

producer.flush()
producer.close()
print("📊 Produced 100 messages")
