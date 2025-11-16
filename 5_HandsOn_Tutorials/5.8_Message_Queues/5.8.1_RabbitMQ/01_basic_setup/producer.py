#!/usr/bin/env python3
"""
RabbitMQ Producer - Basic Example

This script demonstrates how to:
1. Connect to RabbitMQ
2. Create a channel
3. Declare a queue
4. Publish messages to the queue
"""

import pika
import sys
import json
from datetime import datetime


def create_connection():
    """Create a connection to RabbitMQ"""
    credentials = pika.PlainCredentials('admin', 'admin123')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        virtual_host='/',
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300
    )

    try:
        connection = pika.BlockingConnection(parameters)
        print("✓ Connected to RabbitMQ")
        return connection
    except pika.exceptions.AMQPConnectionError as e:
        print(f"✗ Failed to connect to RabbitMQ: {e}")
        sys.exit(1)


def send_message(channel, queue_name, message):
    """Send a message to the queue"""
    # Declare the queue (idempotent - won't recreate if exists)
    channel.queue_declare(
        queue=queue_name,
        durable=True,  # Queue survives broker restart
        exclusive=False,  # Queue can be accessed by other connections
        auto_delete=False  # Queue won't be deleted when last consumer unsubscribes
    )

    # Publish the message
    channel.basic_publish(
        exchange='',  # Default exchange
        routing_key=queue_name,  # Queue name
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
            content_type='application/json',
            timestamp=int(datetime.now().timestamp())
        )
    )

    print(f"✓ Sent message to queue '{queue_name}': {message}")


def main():
    """Main function"""
    queue_name = 'hello_queue'

    # Create connection and channel
    connection = create_connection()
    channel = connection.channel()
    print("✓ Channel created")

    # Send multiple messages
    messages = [
        {"id": 1, "text": "Hello World!", "timestamp": datetime.now().isoformat()},
        {"id": 2, "text": "Hello RabbitMQ!", "timestamp": datetime.now().isoformat()},
        {"id": 3, "text": "First message queue tutorial", "timestamp": datetime.now().isoformat()},
    ]

    for msg in messages:
        message_json = json.dumps(msg)
        send_message(channel, queue_name, message_json)

    # Close the connection
    connection.close()
    print("✓ Connection closed")
    print(f"\n📊 Summary: Sent {len(messages)} messages to queue '{queue_name}'")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n✗ Interrupted by user')
        sys.exit(0)
    except Exception as e:
        print(f'✗ Error: {e}')
        sys.exit(1)
