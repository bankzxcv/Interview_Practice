#!/usr/bin/env python3
"""
RabbitMQ Topic Exchange Consumer

Subscribes using routing key patterns with wildcards:
  * (star) - matches exactly one word
  # (hash) - matches zero or more words

Examples:
  *.error.*        - All error messages
  app.#            - All app facility messages
  #.database       - All database component messages
  kernel.*.memory  - All kernel memory messages
"""

import pika
import json
import sys


def create_connection():
    """Create connection to RabbitMQ"""
    credentials = pika.PlainCredentials('admin', 'admin123')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )
    return pika.BlockingConnection(parameters)


def callback(ch, method, properties, body):
    """Process received messages"""
    try:
        message = json.loads(body.decode('utf-8'))
        routing_key = method.routing_key

        print(f"\n{'='*60}")
        print(f"📨 Received message:")
        print(f"   Routing Key: {routing_key}")
        print(f"   Text: {message['text']}")
        print(f"   Facility: {message['facility']}")
        print(f"   Severity: {message['severity']}")
        print(f"   Component: {message['component']}")
        print(f"   Timestamp: {message['timestamp']}")
        print(f"{'='*60}")

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"✗ Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main():
    """Main function"""
    exchange_name = 'topic_logs'

    # Get binding patterns from command line or use defaults
    if len(sys.argv) > 1:
        binding_keys = sys.argv[1:]
    else:
        # Default: subscribe to all error and critical messages
        binding_keys = ['*.error.*', '*.critical.*']

    # Connect to RabbitMQ
    connection = create_connection()
    channel = connection.channel()

    # Declare exchange
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    # Create exclusive queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Bind queue for each pattern
    print("📌 Binding patterns:")
    for binding_key in binding_keys:
        channel.queue_bind(
            exchange=exchange_name,
            queue=queue_name,
            routing_key=binding_key
        )
        print(f"   ✓ {binding_key}")

    # Set up consumer
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"\n📡 Waiting for messages matching patterns...")
    print("   Press CTRL+C to exit\n")

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✗ Interrupted')
        channel.stop_consuming()
    finally:
        connection.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'✗ Error: {e}')
        sys.exit(1)
