#!/usr/bin/env python3
"""NATS Basic Subscriber"""

import nats
import asyncio
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    async def message_handler(msg):
        data = json.loads(msg.data.decode())
        print(f"📨 Received: {data['text']} (ID: {data['id']})")

    await nc.subscribe("hello.world", cb=message_handler)

    print("📡 Listening on 'hello.world'...")
    print("Press Ctrl+C to exit")

    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        await nc.drain()

if __name__ == '__main__':
    asyncio.run(main())
