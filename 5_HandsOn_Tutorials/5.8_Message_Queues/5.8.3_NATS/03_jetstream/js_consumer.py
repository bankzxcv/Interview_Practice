#!/usr/bin/env python3
"""JetStream Pull Consumer"""

import nats
import asyncio
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Create pull consumer
    consumer = await js.pull_subscribe("orders.*", "order-processor")

    print("📡 JetStream consumer ready...")

    try:
        while True:
            msgs = await consumer.fetch(batch=5, timeout=2)
            for msg in msgs:
                data = json.loads(msg.data.decode())
                print(f"📦 Processing order: {data}")
                await msg.ack()
    except KeyboardInterrupt:
        pass
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
