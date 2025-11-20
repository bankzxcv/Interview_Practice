#!/usr/bin/env ts-node
/**
 * Kafka Consumer with Manual Offset Control - TypeScript Implementation
 * Demonstrates manual partition assignment and seeking to specific offsets
 */

import { Kafka, Consumer, TopicPartitionOffsetAndMetadata } from 'kafkajs';

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

/**
 * Consume messages with manual offset control
 */
async function consumeWithManualOffset(): Promise<void> {
  const kafka = new Kafka({
    clientId: 'manual-offset-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'manual-offset-group',
  });

  try {
    await consumer.connect();
    console.log('✅ Consumer connected');

    const topic = 'user-events';
    const partitions = [0, 1, 2]; // Manually assign partitions

    // Subscribe to topic
    await consumer.subscribe({ topic, fromBeginning: false });

    // Seek to specific offset in partition 0
    consumer.on(consumer.events.GROUP_JOIN, async ({ payload }) => {
      console.log('📍 Consumer joined group, seeking to offset 5 in partition 0');

      // Seek to offset 5 in partition 0
      await consumer.seek({
        topic: topic,
        partition: 0,
        offset: '5',
      });
    });

    console.log('Reading from offset 5 in partition 0...\n');

    let messageCount = 0;
    const maxMessages = 5;

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (messageCount >= maxMessages) {
          await consumer.stop();
          await consumer.disconnect();
          return;
        }

        const value = message.value?.toString();
        if (value) {
          const event: UserEvent = JSON.parse(value);
          console.log(
            `Partition: ${partition}, ` +
            `Offset: ${message.offset}, ` +
            `Value: ${JSON.stringify(event)}`
          );
        }

        messageCount++;
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await consumer.disconnect();
    console.log('\n✅ Consumer disconnected');
  }
}

/**
 * Example: Seek to beginning/end
 */
async function seekExamples(): Promise<void> {
  const kafka = new Kafka({
    clientId: 'seek-example-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'seek-example-group',
  });

  try {
    await consumer.connect();
    const topic = 'user-events';

    await consumer.subscribe({ topic, fromBeginning: false });

    consumer.on(consumer.events.GROUP_JOIN, async () => {
      // Example 1: Seek to beginning
      console.log('📍 Seeking to beginning of partition 0');
      await consumer.seek({
        topic: topic,
        partition: 0,
        offset: '0', // Beginning
      });

      // Example 2: Seek to specific offset
      console.log('📍 Seeking to offset 10 in partition 1');
      await consumer.seek({
        topic: topic,
        partition: 1,
        offset: '10',
      });

      // Example 3: Seek to end (latest)
      // Note: KafkaJS doesn't have a direct "seek to end" method
      // You need to fetch the high watermark first
      const admin = kafka.admin();
      await admin.connect();

      const offsets = await admin.fetchTopicOffsets(topic);
      const partition2Offset = offsets.find(o => o.partition === 2);

      if (partition2Offset) {
        console.log(`📍 Seeking to end of partition 2 (offset ${partition2Offset.high})`);
        await consumer.seek({
          topic: topic,
          partition: 2,
          offset: partition2Offset.high,
        });
      }

      await admin.disconnect();
    });

    // Run consumer for a short time
    setTimeout(async () => {
      await consumer.disconnect();
    }, 10000);

    await consumer.run({
      eachMessage: async ({ partition, message }) => {
        console.log(`P${partition} - Offset: ${message.offset}`);
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    console.log('='.repeat(60));
    console.log('Manual Offset Control Examples');
    console.log('='.repeat(60) + '\n');

    await consumeWithManualOffset();
  } catch (error) {
    console.error('Fatal error:', error);
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

export { consumeWithManualOffset, seekExamples };
