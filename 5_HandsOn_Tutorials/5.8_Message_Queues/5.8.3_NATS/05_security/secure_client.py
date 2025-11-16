#!/usr/bin/env python3
"""NATS Secure Client with Authentication"""

import nats
import asyncio

async def main():
    # Connect with credentials
    nc = await nats.connect(
        "nats://localhost:4222",
        user="admin",
        password="admin123"
    )

    print("✓ Connected with authentication")

    # Publish
    await nc.publish("events.test", b"Secure message")
    print("✓ Published secure message")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
