#!/usr/bin/env python3
"""Redis Multi-Channel Publisher"""

import redis
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

channels = [
    ('news.tech', 'New AI breakthrough'),
    ('news.sports', 'Team wins championship'),
    ('alerts.critical', 'System overload'),
    ('user:login', 'User123 logged in'),
    ('user:logout', 'User456 logged out'),
]

for channel, message in channels:
    subs = r.publish(channel, message)
    print(f"✓ {channel}: {message} ({subs} subscribers)")
    time.sleep(0.5)
