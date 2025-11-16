#!/usr/bin/env python3
"""
RabbitMQ Direct Exchange Consumer

Subscribes to specific routing keys (severities).
Can filter to receive only certain types of messages.
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
        severity = method.routing_key

        print(f"\n{'='*60}")
        print(f"📨 Received [{severity.upper()}] message:")
        print(f"   Text: {message['text']}")
        print(f"   Severity: {message['severity']}")
        print(f"   Timestamp: {message['timestamp']}")
        print(f"{'='*60}")

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"✗ Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main():
    """Main function"""
    exchange_name = 'direct_logs'

    # Get severities to subscribe to (default: all)
    severities = sys.argv[1:] if len(sys.argv) > 1 else ['info', 'warning', 'error', 'critical']

    # Connect to RabbitMQ
    connection = create_connection()
    channel = connection.channel()

    # Declare exchange
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='direct',
        durable=True
    )

    # Create exclusive queue for this consumer
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Bind queue to exchange for each severity
    for severity in severities:
        channel.queue_bind(
            exchange=exchange_name,
            queue=queue_name,
            routing_key=severity
        )
        print(f"✓ Bound to routing key: {severity}")

    # Set up consumer
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"\n📡 Waiting for messages with severities: {', '.join(severities)}")
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
