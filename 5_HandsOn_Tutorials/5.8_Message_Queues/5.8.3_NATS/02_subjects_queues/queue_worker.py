#!/usr/bin/env python3
"""NATS Queue Group Worker"""

import nats
import asyncio
import json
import sys
import os

async def main():
    worker_id = sys.argv[1] if len(sys.argv) > 1 else f"worker-{os.getpid()}"
    nc = await nats.connect("nats://localhost:4222")

    async def handler(msg):
        data = json.loads(msg.data.decode())
        print(f"[{worker_id}] Processing task {data['id']}: {data['task']}")
        await asyncio.sleep(1)  # Simulate work

    # Join queue group "workers"
    await nc.subscribe("tasks", queue="workers", cb=handler)

    print(f"🔧 Worker '{worker_id}' ready (queue: workers)")

    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        await nc.drain()

if __name__ == '__main__':
    asyncio.run(main())
