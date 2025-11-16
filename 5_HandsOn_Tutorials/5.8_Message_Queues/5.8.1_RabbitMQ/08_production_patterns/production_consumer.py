#!/usr/bin/env python3
"""Production-Ready Consumer with Error Handling"""

import pika
import json
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResilientConsumer:
    def __init__(self, host='localhost'):
        self.host = host
        self.connection = None
        self.channel = None
        self.consumer_tag = None

    def connect(self):
        """Establish connection"""
        credentials = pika.PlainCredentials('admin', 'admin123')
        parameters = pika.ConnectionParameters(
            host=self.host,
            port=5672,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()

        # QoS settings
        self.channel.basic_qos(prefetch_count=10)

        logger.info("✓ Connected to RabbitMQ")

    def process_message(self, ch, method, properties, body):
        """Process message with error handling"""
        try:
            message = json.loads(body.decode('utf-8'))
            message_id = message.get('id', 'unknown')

            logger.info(f"📨 Processing message {message_id}")

            # Simulate processing
            time.sleep(0.1)

            # Randomly fail some messages for demo
            if message_id % 20 == 0:
                raise Exception("Simulated processing error")

            # Success - acknowledge
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"✓ Completed message {message_id}")

        except json.JSONDecodeError:
            logger.error("✗ Invalid JSON - rejecting message")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        except Exception as e:
            logger.error(f"✗ Processing error: {e}")

            # Check redelivery count
            if method.redelivered:
                logger.warning("⚠️  Already redelivered - sending to DLX")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            else:
                logger.info("🔄 Requeueing for retry")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def start_consuming(self):
        """Start consuming messages"""
        self.channel.queue_declare(
            queue='production_queue',
            durable=True,
            arguments={'x-queue-type': 'quorum'}
        )

        self.consumer_tag = self.channel.basic_consume(
            queue='production_queue',
            on_message_callback=self.process_message,
            auto_ack=False
        )

        logger.info("📡 Waiting for messages...")

        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            logger.info("Stopping consumer...")
            self.stop_consuming()

    def stop_consuming(self):
        """Stop consuming gracefully"""
        if self.channel:
            self.channel.stop_consuming()
        if self.connection and not self.connection.is_closed:
            self.connection.close()
        logger.info("✓ Consumer stopped")


def main():
    consumer = ResilientConsumer()
    consumer.connect()
    consumer.start_consuming()


if __name__ == '__main__':
    main()
