#!/usr/bin/env python3
"""Redis Pattern Subscriber"""

import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
pubsub = r.pubsub()

# Subscribe to patterns
patterns = ['news.*', 'alerts.*', 'user:*']
pubsub.psubscribe(*patterns)

print(f"📡 Subscribed to patterns: {', '.join(patterns)}\n")

try:
    for message in pubsub.listen():
        if message['type'] == 'pmessage':
            print(f"📨 Pattern: {message['pattern']}")
            print(f"   Channel: {message['channel']}")
            print(f"   Data: {message['data']}\n")

except KeyboardInterrupt:
    pubsub.punsubscribe()
    pubsub.close()
