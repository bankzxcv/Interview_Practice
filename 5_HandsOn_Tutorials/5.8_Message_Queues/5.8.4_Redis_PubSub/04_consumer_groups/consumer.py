#!/usr/bin/env python3
"""Redis Streams Consumer Group Member"""

import redis
import sys
import time

consumer_name = sys.argv[1] if len(sys.argv) > 1 else 'consumer1'

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

stream = 'tasks'
group = 'processors'

print(f"🔧 Consumer '{consumer_name}' in group '{group}'\n")

try:
    while True:
        # Read messages from stream as consumer group member
        messages = r.xreadgroup(
            group,
            consumer_name,
            {stream: '>'},  # Only new messages
            count=1,
            block=1000
        )

        if messages:
            for stream_name, msgs in messages:
                for msg_id, data in msgs:
                    print(f"[{consumer_name}] Processing: {data}")

                    # Simulate processing
                    time.sleep(0.5)

                    # Acknowledge message
                    r.xack(stream, group, msg_id)
                    print(f"[{consumer_name}] ✓ Acknowledged {msg_id}\n")

except KeyboardInterrupt:
    print(f"\n[{consumer_name}] Stopped")
