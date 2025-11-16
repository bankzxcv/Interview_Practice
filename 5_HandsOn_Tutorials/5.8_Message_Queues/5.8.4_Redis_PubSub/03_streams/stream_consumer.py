#!/usr/bin/env python3
"""Redis Streams Consumer"""

import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

stream_name = 'orders'
last_id = '0'  # Start from beginning

print(f"📡 Reading from stream '{stream_name}'...\n")

try:
    while True:
        # Read new messages
        messages = r.xread({stream_name: last_id}, count=5, block=1000)

        if messages:
            for stream, msgs in messages:
                for msg_id, data in msgs:
                    print(f"📦 Message ID: {msg_id}")
                    print(f"   Order: {data}")
                    last_id = msg_id

except KeyboardInterrupt:
    print("\n✓ Stopped")
