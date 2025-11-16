#!/usr/bin/env python3
"""Redis PubSub Subscriber"""

import redis
import json

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Create pubsub object and subscribe
pubsub = r.pubsub()
pubsub.subscribe('notifications')

print("📡 Subscribed to 'notifications' channel")
print("   Waiting for messages (Ctrl+C to exit)...\n")

try:
    for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            print(f"📨 Received: {data['text']}")
            print(f"   ID: {data['id']}, Time: {data['timestamp']}\n")

except KeyboardInterrupt:
    print("\n✓ Unsubscribed")
    pubsub.unsubscribe()
finally:
    pubsub.close()
