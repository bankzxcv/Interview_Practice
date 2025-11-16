#!/usr/bin/env python3
"""
RabbitMQ Direct Exchange Producer

Routes messages based on exact routing key match.
Use case: Task distribution based on severity or type
"""

import pika
import json
import sys
from datetime import datetime


def create_connection():
    """Create connection to RabbitMQ"""
    credentials = pika.PlainCredentials('admin', 'admin123')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )
    return pika.BlockingConnection(parameters)


def publish_message(channel, exchange, routing_key, message):
    """Publish message to direct exchange"""
    channel.basic_publish(
        exchange=exchange,
        routing_key=routing_key,
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type='application/json'
        )
    )
    print(f"✓ Sent [{routing_key}]: {message['text']}")


def main():
    """Main function"""
    exchange_name = 'direct_logs'

    # Connect to RabbitMQ
    connection = create_connection()
    channel = connection.channel()

    # Declare direct exchange
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='direct',
        durable=True
    )
    print(f"✓ Exchange '{exchange_name}' declared (type: direct)\n")

    # Send messages with different severities
    messages = [
        {
            'routing_key': 'info',
            'message': {
                'text': 'Application started successfully',
                'severity': 'info',
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'routing_key': 'warning',
            'message': {
                'text': 'High memory usage detected',
                'severity': 'warning',
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'routing_key': 'error',
            'message': {
                'text': 'Database connection failed',
                'severity': 'error',
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'routing_key': 'critical',
            'message': {
                'text': 'System crash imminent',
                'severity': 'critical',
                'timestamp': datetime.now().isoformat()
            }
        }
    ]

    for item in messages:
        publish_message(
            channel,
            exchange_name,
            item['routing_key'],
            item['message']
        )

    connection.close()
    print(f"\n📊 Sent {len(messages)} messages to '{exchange_name}' exchange")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n✗ Interrupted')
        sys.exit(0)
    except Exception as e:
        print(f'✗ Error: {e}')
        sys.exit(1)
