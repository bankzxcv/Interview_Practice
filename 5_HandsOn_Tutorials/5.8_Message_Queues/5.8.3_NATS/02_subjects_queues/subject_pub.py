#!/usr/bin/env python3
"""NATS Publisher with Various Subjects"""

import nats
import asyncio
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    subjects = [
        ("events.user.login", "User logged in"),
        ("events.user.logout", "User logged out"),
        ("events.system.startup", "System started"),
        ("events.system.shutdown", "System stopped"),
        ("tasks", "Process order #1"),
        ("tasks", "Process order #2"),
        ("tasks", "Process order #3"),
    ]

    for i, (subject, text) in enumerate(subjects):
        msg = {'id': i, 'task': text}
        await nc.publish(subject, json.dumps(msg).encode())
        print(f"✓ Published to '{subject}': {text}")
        await asyncio.sleep(0.3)

    await nc.drain()

if __name__ == '__main__':
    asyncio.run(main())
