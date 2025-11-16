#!/usr/bin/env python3
"""
RabbitMQ Topic Exchange Producer

Routes messages based on routing key patterns.
Use case: Logging systems, event distribution with filtering
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
    """Publish message to topic exchange"""
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
    exchange_name = 'topic_logs'

    # Connect to RabbitMQ
    connection = create_connection()
    channel = connection.channel()

    # Declare topic exchange
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )
    print(f"✓ Exchange '{exchange_name}' declared (type: topic)\n")

    # Send messages with hierarchical routing keys
    # Format: <facility>.<severity>.<component>
    messages = [
        {
            'routing_key': 'app.info.startup',
            'message': {
                'text': 'Application started',
                'facility': 'app',
                'severity': 'info',
                'component': 'startup',
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'routing_key': 'app.error.database',
            'message': {
                'text': 'Database connection failed',
                'facility': 'app',
                'severity': 'error',
                'component': 'database',
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'routing_key': 'kernel.critical.memory',
            'message': {
                'text': 'Out of memory',
                'facility': 'kernel',
                'severity': 'critical',
                'component': 'memory',
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'routing_key': 'app.warning.authentication',
            'message': {
                'text': 'Multiple failed login attempts',
                'facility': 'app',
                'severity': 'warning',
                'component': 'authentication',
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'routing_key': 'kernel.info.network',
            'message': {
                'text': 'Network interface up',
                'facility': 'kernel',
                'severity': 'info',
                'component': 'network',
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
