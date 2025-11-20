#!/usr/bin/env ts-node
/**
 * Kafka Consumer - TypeScript Implementation
 * Demonstrates consuming messages with proper typing and manual offset commits
 */

import { Kafka, Consumer, EachMessagePayload, KafkaMessage } from 'kafkajs';

// Message type definition (matching producer)
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

// Consumer configuration interface
interface ConsumerConfig {
  brokers: string[];
  groupId: string;
  topic: string;
}

/**
 * Create and configure Kafka consumer
 */
async function createConsumer(
  brokers: string[],
  groupId: string
): Promise<Consumer> {
  const kafka = new Kafka({
    clientId: 'typescript-consumer',
    brokers: brokers,
    retry: {
      initialRetryTime: 100,
      retries: 3,
    },
  });

  const consumer = kafka.consumer({
    groupId: groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 10000,
    maxBytesPerPartition: 1048576,
    retry: {
      initialRetryTime: 100,
      retries: 5,
    },
  });

  await consumer.connect();
  console.log(`✅ Consumer created with group_id: ${groupId}`);

  return consumer;
}

/**
 * Process individual message
 */
function processMessage(message: UserEvent): void {
  const eventType = message.event_type;
  const userId = message.user_id;

  if (eventType === 'login') {
    console.log(`   Processing login for ${userId}`);
  } else if (eventType === 'logout') {
    console.log(`   Processing logout for ${userId}`);
  }
}

/**
 * Message handler
 */
async function handleMessage(payload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = payload;

  try {
    // Deserialize message
    const key = message.key?.toString() || 'null';
    const value = message.value?.toString();

    if (!value) {
      console.warn('⚠️ Received message with no value');
      return;
    }

    const userEvent: UserEvent = JSON.parse(value);

    // Display message details
    console.log(
      `📨 Message | ` +
      `Partition: ${partition} | ` +
      `Offset: ${message.offset} | ` +
      `Key: ${key}`
    );
    console.log(`   Value: ${JSON.stringify(userEvent, null, 2)}`);

    // Process message (business logic)
    processMessage(userEvent);

    console.log(`   ✓ Committed offset ${message.offset}\n`);
  } catch (error) {
    console.error('❌ Error processing message:', error);
    throw error; // Re-throw to trigger retry/DLQ logic
  }
}

/**
 * Consume messages from topic
 */
async function consumeMessages(
  consumer: Consumer,
  topic: string
): Promise<void> {
  await consumer.subscribe({
    topic: topic,
    fromBeginning: true,
  });

  console.log(`⏳ Waiting for messages. Press CTRL+C to exit\n`);

  await consumer.run({
    autoCommit: false, // Manual commit for reliability
    eachMessage: async (payload) => {
      await handleMessage(payload);

      // Manual commit after successful processing
      await consumer.commitOffsets([
        {
          topic: payload.topic,
          partition: payload.partition,
          offset: (parseInt(payload.message.offset) + 1).toString(),
        },
      ]);
    },
  });
}

/**
 * Graceful shutdown handler
 */
async function shutdown(consumer: Consumer, signal: string): Promise<void> {
  console.log(`\n🔌 ${signal} received. Shutting down gracefully...`);
  try {
    await consumer.disconnect();
    console.log('✅ Consumer disconnected gracefully');
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
  const config: ConsumerConfig = {
    brokers: ['localhost:9092'],
    groupId: 'consumer-group-1',
    topic: 'user-events',
  };

  let consumer: Consumer | null = null;

  try {
    consumer = await createConsumer(config.brokers, config.groupId);

    // Setup graceful shutdown handlers
    process.on('SIGINT', () => shutdown(consumer!, 'SIGINT'));
    process.on('SIGTERM', () => shutdown(consumer!, 'SIGTERM'));

    await consumeMessages(consumer, config.topic);
  } catch (error) {
    console.error('❌ Consumer error:', error);
    if (consumer) {
      await consumer.disconnect();
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createConsumer, consumeMessages, handleMessage, UserEvent };
