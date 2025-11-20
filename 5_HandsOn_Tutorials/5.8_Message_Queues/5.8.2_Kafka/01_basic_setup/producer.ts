#!/usr/bin/env ts-node
/**
 * Kafka Producer - TypeScript Implementation
 * Demonstrates producing messages with proper typing and error handling
 */

import { Kafka, Producer, ProducerRecord, RecordMetadata, CompressionTypes } from 'kafkajs';

// Message type definition
interface UserEvent {
  user_id: string;
  event_id: number;
  event_type: 'login' | 'logout';
  timestamp: string;
  metadata: {
    ip_address: string;
    device: 'mobile' | 'web';
  };
}

// Producer configuration interface
interface ProducerConfig {
  brokers: string[];
  topic: string;
  numMessages: number;
}

/**
 * Create and configure Kafka producer
 */
async function createProducer(brokers: string[]): Promise<Producer> {
  const kafka = new Kafka({
    clientId: 'typescript-producer',
    brokers: brokers,
    retry: {
      initialRetryTime: 100,
      retries: 3,
    },
  });

  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionalId: undefined,
    maxInFlightRequests: 1, // Ensure ordering
    idempotent: true,
    compression: CompressionTypes.GZIP,
  });

  await producer.connect();
  console.log('✅ Producer connected successfully');

  return producer;
}

/**
 * Send messages to Kafka topic
 */
async function sendMessages(
  producer: Producer,
  config: ProducerConfig
): Promise<void> {
  try {
    for (let i = 1; i <= config.numMessages; i++) {
      const userId = `user-${i % 3}`;

      const message: UserEvent = {
        user_id: userId,
        event_id: i,
        event_type: i % 2 === 0 ? 'login' : 'logout',
        timestamp: new Date().toISOString(),
        metadata: {
          ip_address: `192.168.1.${i}`,
          device: i % 2 === 0 ? 'mobile' : 'web',
        },
      };

      const record: ProducerRecord = {
        topic: config.topic,
        messages: [
          {
            key: userId,
            value: JSON.stringify(message),
            headers: {
              'content-type': 'application/json',
            },
          },
        ],
      };

      const metadata: RecordMetadata[] = await producer.send(record);

      metadata.forEach((meta) => {
        console.log(
          `✓ Sent message ${i}/${config.numMessages} | ` +
          `Key: ${userId} | ` +
          `Partition: ${meta.partition} | ` +
          `Offset: ${meta.offset}`
        );
      });

      // Simulate delay between messages
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n✓ Successfully sent ${config.numMessages} messages`);
  } catch (error) {
    console.error('❌ Error sending messages:', error);
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(producer: Producer, signal: string): Promise<void> {
  console.log(`\n📤 ${signal} received. Flushing remaining messages...`);
  try {
    await producer.disconnect();
    console.log('✅ Producer disconnected gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const config: ProducerConfig = {
    brokers: ['localhost:9092'],
    topic: 'user-events',
    numMessages: 10,
  };

  let producer: Producer | null = null;

  try {
    producer = await createProducer(config.brokers);

    // Setup graceful shutdown handlers
    process.on('SIGINT', () => shutdown(producer!, 'SIGINT'));
    process.on('SIGTERM', () => shutdown(producer!, 'SIGTERM'));

    await sendMessages(producer, config);
  } catch (error) {
    console.error('❌ Producer error:', error);
    process.exit(1);
  } finally {
    if (producer) {
      await producer.disconnect();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createProducer, sendMessages, UserEvent, ProducerConfig };
