#!/usr/bin/env python3
"""Redis PubSub Publisher"""

import redis
import json
import time
from datetime import datetime

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

channel = 'notifications'

# Publish messages
for i in range(10):
    message = {
        'id': i,
        'text': f'Notification {i}',
        'timestamp': datetime.now().isoformat()
    }

    # Publish returns number of subscribers that received the message
    num_subscribers = r.publish(channel, json.dumps(message))

    print(f"✓ Published to '{channel}': {message['text']}")
    print(f"  Subscribers: {num_subscribers}")

    time.sleep(1)

print(f"\n📊 Published 10 messages")
