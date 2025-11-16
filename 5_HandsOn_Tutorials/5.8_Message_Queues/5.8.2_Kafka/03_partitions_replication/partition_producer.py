#!/usr/bin/env python3
"""Kafka Producer with Custom Partitioning"""

from kafka import KafkaProducer
from kafka.partitioner import murmur2_partitioner
import json

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092', 'localhost:9093', 'localhost:9094'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8'),
    partitioner=murmur2_partitioner,
    acks='all'
)

# Send to specific partitions using keys
user_ids = ['user1', 'user2', 'user3', 'user4', 'user5']

for i in range(30):
    user_id = user_ids[i % len(user_ids)]
    msg = {'user_id': user_id, 'event': f'Event-{i}'}

    metadata = producer.send('replicated-topic', key=user_id, value=msg).get()
    print(f"✓ User: {user_id}, Partition: {metadata.partition}, Offset: {metadata.offset}")

producer.close()
