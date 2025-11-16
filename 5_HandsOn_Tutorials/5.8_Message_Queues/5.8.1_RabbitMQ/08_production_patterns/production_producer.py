#!/usr/bin/env python3
"""Production-Ready Publisher with Confirms and Retries"""

import pika
import json
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResilientProducer:
    def __init__(self, host='localhost', max_retries=3):
        self.host = host
        self.max_retries = max_retries
        self.connection = None
        self.channel = None
        self.returned_messages = []

    def connect(self):
        """Establish connection with retry logic"""
        for attempt in range(self.max_retries):
            try:
                credentials = pika.PlainCredentials('admin', 'admin123')
                parameters = pika.ConnectionParameters(
                    host=self.host,
                    port=5672,
                    credentials=credentials,
                    heartbeat=600,
                    blocked_connection_timeout=300,
                    connection_attempts=3,
                    retry_delay=2
                )
                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()

                # Enable publisher confirms
                self.channel.confirm_delivery()

                # Handle returned messages
                self.channel.add_on_return_callback(self.on_return)

                logger.info("✓ Connected to RabbitMQ")
                return True
            except Exception as e:
                logger.error(f"Connection attempt {attempt + 1} failed: {e}")
                time.sleep(2 ** attempt)

        return False

    def on_return(self, channel, method, properties, body):
        """Handle unroutable messages"""
        logger.warning(f"⚠️  Message returned: {body}")
        self.returned_messages.append(body)

    def publish(self, exchange, routing_key, message, mandatory=True):
        """Publish with confirms and retry logic"""
        for attempt in range(self.max_retries):
            try:
                if not self.connection or self.connection.is_closed:
                    self.connect()

                self.channel.basic_publish(
                    exchange=exchange,
                    routing_key=routing_key,
                    body=json.dumps(message),
                    properties=pika.BasicProperties(
                        delivery_mode=2,  # Persistent
                        content_type='application/json',
                        timestamp=int(time.time())
                    ),
                    mandatory=mandatory
                )

                logger.info(f"✓ Published: {message['id']}")
                return True

            except pika.exceptions.UnroutableError:
                logger.error(f"✗ Message unroutable: {message['id']}")
                return False
            except Exception as e:
                logger.error(f"✗ Publish failed (attempt {attempt + 1}): {e}")
                time.sleep(2 ** attempt)

        return False

    def close(self):
        """Close connection gracefully"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("✓ Connection closed")


def main():
    producer = ResilientProducer()

    if not producer.connect():
        logger.error("Failed to connect to RabbitMQ")
        return

    # Declare exchange and queue
    producer.channel.exchange_declare(
        exchange='production_exchange',
        exchange_type='direct',
        durable=True
    )

    producer.channel.queue_declare(
        queue='production_queue',
        durable=True,
        arguments={
            'x-queue-type': 'quorum',
            'x-dead-letter-exchange': 'dlx'
        }
    )

    producer.channel.queue_bind(
        exchange='production_exchange',
        queue='production_queue',
        routing_key='production'
    )

    # Send messages
    for i in range(100):
        message = {
            'id': i,
            'type': 'order',
            'amount': 100 + i,
            'timestamp': datetime.now().isoformat()
        }

        success = producer.publish(
            exchange='production_exchange',
            routing_key='production',
            message=message
        )

        if not success:
            logger.error(f"Failed to publish message {i}")

        time.sleep(0.1)

    producer.close()


if __name__ == '__main__':
    main()
