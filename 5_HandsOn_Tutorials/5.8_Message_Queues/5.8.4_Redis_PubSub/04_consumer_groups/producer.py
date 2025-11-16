#!/usr/bin/env python3
"""Producer for Consumer Group Demo"""

import redis
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

for i in range(30):
    msg_id = r.xadd('tasks', {'task_id': i, 'data': f'Task-{i}'})
    print(f"✓ Added task {i}: {msg_id}")
    time.sleep(0.2)

print("\n📊 Added 30 tasks to stream")
