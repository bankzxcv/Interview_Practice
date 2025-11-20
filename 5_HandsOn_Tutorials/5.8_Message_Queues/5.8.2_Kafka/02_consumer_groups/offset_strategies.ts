#!/usr/bin/env ts-node
/**
 * Offset Commit Strategies - TypeScript Implementation
 * Demonstrates different offset commit approaches
 */

import { Kafka, Consumer, EachMessagePayload, EachBatchPayload } from 'kafkajs';

interface OrderEvent {
  order_id: string;
  customer_id: string;
  order_type: string;
  amount: number;
  timestamp: string;
}

/**
 * Auto-commit offsets (less control, simpler)
 */
async function autoCommitConsumer(): Promise<void> {
  console.log('\n=== AUTO COMMIT STRATEGY ===\n');

  const kafka = new Kafka({
    clientId: 'auto-commit-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'auto-commit-group',
    autoCommit: true, // Auto commit enabled
    autoCommitInterval: 5000, // Commit every 5 seconds
  });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order-events', fromBeginning: true });

    let count = 0;
    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (count >= 5) {
          await consumer.stop();
          return;
        }

        const value = message.value?.toString();
        if (value) {
          const order: OrderEvent = JSON.parse(value);
          console.log(`Consumed: ${order.order_id} (offset auto-committed)`);
          count++;
        }
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await consumer.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await consumer.disconnect();
  }
}

/**
 * Manual synchronous commit (reliable but slower)
 */
async function manualCommitSync(): Promise<void> {
  console.log('\n=== MANUAL SYNC COMMIT STRATEGY ===\n');

  const kafka = new Kafka({
    clientId: 'manual-sync-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'manual-sync-group',
    autoCommit: false, // Manual commit
  });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order-events', fromBeginning: true });

    let count = 0;
    await consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        if (count >= 5) {
          await consumer.stop();
          return;
        }

        const value = message.value?.toString();
        if (value) {
          const order: OrderEvent = JSON.parse(value);
          console.log(`Processing: ${order.order_id}`);

          // Process message
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Commit after successful processing (blocks)
          await consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (parseInt(message.offset) + 1).toString(),
            },
          ]);
          console.log(`  ✓ Committed offset ${message.offset}`);
          count++;
        }
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await consumer.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await consumer.disconnect();
  }
}

/**
 * Batch commit for better performance
 */
async function batchCommit(): Promise<void> {
  console.log('\n=== BATCH COMMIT STRATEGY ===\n');

  const kafka = new Kafka({
    clientId: 'batch-commit-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'batch-commit-group',
    autoCommit: false,
  });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order-events', fromBeginning: true });

    const batchSize = 3;
    let processedCount = 0;

    await consumer.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat }: EachBatchPayload) => {
        const messages = batch.messages.slice(0, 10 - processedCount);

        for (const message of messages) {
          if (processedCount >= 10) break;

          const value = message.value?.toString();
          if (value) {
            const order: OrderEvent = JSON.parse(value);
            processedCount++;
            console.log(
              `Buffered: ${order.order_id} (${processedCount % batchSize || batchSize}/${batchSize})`
            );

            // Commit when batch is full
            if (processedCount % batchSize === 0) {
              console.log(`  ✓ Processing batch of ${batchSize} messages`);
              await new Promise((resolve) => setTimeout(resolve, 200));

              // Commit after batch processing
              resolveOffset(message.offset);
              await heartbeat();
              console.log(`  ✓ Committed batch\n`);
            }
          }
        }

        // Commit remaining messages
        if (messages.length > 0 && processedCount % batchSize !== 0) {
          const lastMessage = messages[messages.length - 1];
          resolveOffset(lastMessage.offset);
          console.log(`  ✓ Committed final batch of ${processedCount % batchSize} messages`);
        }

        if (processedCount >= 10) {
          await consumer.stop();
        }
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await consumer.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await consumer.disconnect();
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    await autoCommitConsumer();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await manualCommitSync();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await batchCommit();

    console.log('\n✅ All offset strategies demonstrated');
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

export { autoCommitConsumer, manualCommitSync, batchCommit };
