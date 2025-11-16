#!/usr/bin/env python3
"""Test Redis Persistence"""

import redis
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Add messages to stream
print("Adding messages to stream...")
for i in range(100):
    r.xadd('persistent_stream', {'msg': f'Message-{i}'})

print(f"✓ Added 100 messages")

# Force save
r.save()
print("✓ Forced RDB snapshot")

# Check AOF rewrite
r.bgrewriteaof()
print("✓ Triggered AOF rewrite")

# Get persistence info
info = r.info('persistence')
print(f"\n📊 Persistence Info:")
print(f"  RDB last save: {info['rdb_last_save_time']}")
print(f"  AOF enabled: {info['aof_enabled']}")
if info['aof_enabled']:
    print(f"  AOF current size: {info['aof_current_size']} bytes")

print("\n✓ Messages persisted to disk")
