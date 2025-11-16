#!/usr/bin/env python3
"""JetStream Publisher"""

import nats
from nats.js.api import StreamConfig
import asyncio
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Create or get stream
    try:
        await js.add_stream(
            name="ORDERS",
            subjects=["orders.*"],
            retention="limits",
            max_msgs=1000,
            max_age=24*60*60  # 24 hours in seconds
        )
        print("✓ Stream 'ORDERS' created")
    except:
        print("Stream already exists")

    # Publish messages
    for i in range(20):
        msg = {'order_id': f'ORD-{i:04d}', 'amount': 100 + i * 10}
        ack = await js.publish("orders.new", json.dumps(msg).encode())
        print(f"✓ Published order {i}: seq={ack.seq}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
