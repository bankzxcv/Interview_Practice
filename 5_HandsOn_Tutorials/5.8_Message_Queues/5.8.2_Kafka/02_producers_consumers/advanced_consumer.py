#!/usr/bin/env python3
"""Advanced Kafka Consumer with Manual Commits"""

from kafka import KafkaConsumer, TopicPartition
import json

consumer = KafkaConsumer(
    'advanced-topic',
    bootstrap_servers=['localhost:9092'],
    group_id='advanced-group',
    enable_auto_commit=False,  # Manual commit
    auto_offset_reset='earliest',
    max_poll_records=10,
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

print("📡 Consuming with manual commits...")

try:
    for message in consumer:
        print(f"📨 {message.value['id']}: {message.value['data']}")

        # Manual commit after processing
        consumer.commit()

except KeyboardInterrupt:
    print("\n✓ Stopped")
finally:
    consumer.close()
