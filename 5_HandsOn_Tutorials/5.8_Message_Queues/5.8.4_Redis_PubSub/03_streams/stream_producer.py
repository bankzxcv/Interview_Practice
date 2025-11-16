#!/usr/bin/env python3
"""Redis Streams Producer"""

import redis
import json
from datetime import datetime

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

stream_name = 'orders'

# Add messages to stream
for i in range(20):
    message = {
        'order_id': f'ORD-{i:04d}',
        'amount': 100 + i * 10,
        'status': 'pending',
        'timestamp': datetime.now().isoformat()
    }

    # XADD returns message ID
    msg_id = r.xadd(stream_name, message)

    print(f"✓ Added to stream: {message['order_id']}")
    print(f"  Message ID: {msg_id}\n")

# Get stream info
info = r.xinfo_stream(stream_name)
print(f"📊 Stream '{stream_name}': {info['length']} messages")
