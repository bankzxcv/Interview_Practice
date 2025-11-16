#!/usr/bin/env python3
"""Create Consumer Group"""

import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

try:
    r.xgroup_create('tasks', 'processors', id='0', mkstream=True)
    print("✓ Created consumer group 'processors' on stream 'tasks'")
except redis.ResponseError as e:
    if 'BUSYGROUP' in str(e):
        print("⚠ Consumer group already exists")
    else:
        raise
