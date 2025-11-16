#!/usr/bin/env python3
"""NATS Basic Publisher"""

import nats
import asyncio
import json
from datetime import datetime

async def main():
    nc = await nats.connect("nats://localhost:4222")

    # Publish messages
    for i in range(10):
        msg = {'id': i, 'text': f'Message {i}', 'ts': datetime.now().isoformat()}
        await nc.publish("hello.world", json.dumps(msg).encode())
        print(f"✓ Published: {msg['text']}")
        await asyncio.sleep(0.5)

    await nc.drain()

if __name__ == '__main__':
    asyncio.run(main())
