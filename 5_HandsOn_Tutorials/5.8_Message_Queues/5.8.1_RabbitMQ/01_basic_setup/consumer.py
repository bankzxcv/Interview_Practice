#!/usr/bin/env python3
"""
RabbitMQ Consumer - Basic Example

This script demonstrates how to:
1. Connect to RabbitMQ
2. Create a channel
3. Declare a queue
4. Consume messages from the queue
5. Process messages with acknowledgments
"""

import pika
import sys
import json
import time


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


def callback(ch, method, properties, body):
    """
    Callback function to process received messages

    Args:
        ch: Channel
        method: Method frame with delivery tag and routing key
        properties: Message properties
        body: Message body (bytes)
    """
    try:
        # Decode and parse the message
        message = body.decode('utf-8')
        data = json.loads(message)

        print(f"\n{'='*60}")
        print(f"✓ Received message:")
        print(f"  Message ID: {data.get('id', 'N/A')}")
        print(f"  Text: {data.get('text', 'N/A')}")
        print(f"  Timestamp: {data.get('timestamp', 'N/A')}")
        print(f"  Delivery Tag: {method.delivery_tag}")
        print(f"  Routing Key: {method.routing_key}")
        print(f"  Content Type: {properties.content_type}")
        print(f"{'='*60}")

        # Simulate processing time
        time.sleep(1)

        # Manually acknowledge the message
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("✓ Message acknowledged")

    except json.JSONDecodeError as e:
        print(f"✗ Failed to parse message: {e}")
        # Reject the message and don't requeue
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        print(f"✗ Error processing message: {e}")
        # Reject the message and requeue it
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    """Main function"""
    queue_name = 'hello_queue'

    # Create connection and channel
    connection = create_connection()
    channel = connection.channel()
    print("✓ Channel created")

    # Declare the queue (must match producer's queue declaration)
    channel.queue_declare(
        queue=queue_name,
        durable=True,
        exclusive=False,
        auto_delete=False
    )
    print(f"✓ Queue '{queue_name}' declared")

    # Set prefetch count - only deliver 1 message at a time
    # Consumer must ack before receiving the next message
    channel.basic_qos(prefetch_count=1)

    # Set up the consumer
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False  # Manual acknowledgment
    )

    print(f"\n📡 Waiting for messages from queue '{queue_name}'...")
    print("   Press CTRL+C to exit\n")

    try:
        # Start consuming messages
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✗ Interrupted by user')
        channel.stop_consuming()
    finally:
        connection.close()
        print("✓ Connection closed")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'✗ Error: {e}')
        sys.exit(1)
