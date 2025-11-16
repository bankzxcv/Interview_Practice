#!/usr/bin/env python3
"""Production-Ready Task Queue with Redis Streams"""

import redis
import json
import time
from datetime import datetime

class TaskQueue:
    def __init__(self, host='localhost', port=6379, password=None):
        self.r = redis.Redis(
            host=host,
            port=port,
            password=password,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        self.stream = 'tasks'
        self.group = 'workers'

    def create_group(self):
        """Create consumer group"""
        try:
            self.r.xgroup_create(self.stream, self.group, id='0', mkstream=True)
            print(f"✓ Created consumer group '{self.group}'")
        except redis.ResponseError as e:
            if 'BUSYGROUP' in str(e):
                print(f"⚠ Group '{self.group}' already exists")
            else:
                raise

    def add_task(self, task_type, data):
        """Add task to queue"""
        task = {
            'type': task_type,
            'data': json.dumps(data),
            'created_at': datetime.now().isoformat(),
            'retry_count': '0'
        }
        msg_id = self.r.xadd(self.stream, task, maxlen=10000)
        print(f"✓ Added task: {msg_id}")
        return msg_id

    def process_tasks(self, consumer_name, batch_size=10):
        """Process tasks from queue"""
        print(f"🔧 Worker '{consumer_name}' started")

        while True:
            try:
                messages = self.r.xreadgroup(
                    self.group,
                    consumer_name,
                    {self.stream: '>'},
                    count=batch_size,
                    block=1000
                )

                if messages:
                    for stream_name, msgs in messages:
                        for msg_id, data in msgs:
                            self.process_message(msg_id, data)

            except Exception as e:
                print(f"✗ Error: {e}")
                time.sleep(5)

    def process_message(self, msg_id, data):
        """Process individual message"""
        try:
            task_type = data['type']
            task_data = json.loads(data['data'])

            print(f"📋 Processing {task_type}: {task_data}")

            # Simulate work
            time.sleep(0.5)

            # Acknowledge
            self.r.xack(self.stream, self.group, msg_id)
            print(f"✓ Completed: {msg_id}\n")

        except Exception as e:
            print(f"✗ Failed {msg_id}: {e}")
            # Could re-add to stream for retry
            retry_count = int(data.get('retry_count', 0))
            if retry_count < 3:
                data['retry_count'] = str(retry_count + 1)
                self.r.xadd(self.stream, data)

    def get_stats(self):
        """Get queue statistics"""
        info = self.r.xinfo_stream(self.stream)
        groups = self.r.xinfo_groups(self.stream)

        print(f"\n📊 Queue Statistics:")
        print(f"  Stream length: {info['length']}")
        print(f"  Consumer groups: {len(groups)}")

        for group in groups:
            print(f"\n  Group: {group['name']}")
            print(f"    Pending: {group['pending']}")
            print(f"    Consumers: {group['consumers']}")


if __name__ == '__main__':
    import sys

    queue = TaskQueue(password='SecurePass123')

    if len(sys.argv) > 1 and sys.argv[1] == 'worker':
        queue.create_group()
        consumer_name = sys.argv[2] if len(sys.argv) > 2 else 'worker1'
        queue.process_tasks(consumer_name)
    else:
        # Producer mode
        queue.create_group()
        for i in range(20):
            queue.add_task('order', {'order_id': i, 'amount': 100 + i})
        queue.get_stats()
