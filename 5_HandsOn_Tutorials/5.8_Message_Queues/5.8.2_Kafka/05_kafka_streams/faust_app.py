#!/usr/bin/env python3
"""Kafka Streams Alternative using Faust"""

import faust

app = faust.App(
    'stream-app',
    broker='kafka://localhost:9092',
    value_serializer='json',
)

# Input topic
events_topic = app.topic('input-events')

# Output topic
processed_topic = app.topic('processed-events')

# Agent (stream processor)
@app.agent(events_topic)
async def process(stream):
    async for event in stream:
        if event.get('value', 0) > 50:
            processed = {
                'id': event['id'],
                'value': event['value'] * 2,
                'processed': True
            }
            await processed_topic.send(value=processed)
            print(f"✓ Processed: {processed}")

if __name__ == '__main__':
    app.main()
