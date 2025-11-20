#!/usr/bin/env ts-node
/**
 * Consumer Group - TypeScript Implementation
 * Multiple consumers in same group distribute partition load
 */

import { Kafka, Consumer, EachMessagePayload, Assignment } from 'kafkajs';

interface OrderEvent {
  order_id: string;
  customer_id: string;
  order_type: 'created' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  amount: number;
  timestamp: string;
}

interface ConsumerStats {
  messageCount: number;
  partitionCounts: Record<number, number>;
}

/**
 * Create consumer as part of a group
 */
async function createConsumer(consumerId: number): Promise<Consumer> {
  const kafka = new Kafka({
    clientId: `consumer-${consumerId}`,
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'order-processing-group',
    sessionTimeout: 30000,
    heartbeatInterval: 10000,
    maxPollIntervalMs: 300000,
  });

  await consumer.connect();
  return consumer;
}

/**
 * Consume orders as part of consumer group
 */
async function consumeOrders(consumerId: number): Promise<void> {
  const consumer = await createConsumer(consumerId);
  const stats: ConsumerStats = {
    messageCount: 0,
    partitionCounts: {},
  };

  let assignedPartitions: number[] = [];

  try {
    // Subscribe to topic
    await consumer.subscribe({
      topic: 'order-events',
      fromBeginning: true,
    });

    console.log(`[Consumer-${consumerId}] Consumer started, waiting for partition assignment...`);

    // Listen for rebalance events
    consumer.on(consumer.events.GROUP_JOIN, ({ payload }) => {
      console.log(`[Consumer-${consumerId}] 🔷 Joined consumer group`);
    });

    consumer.on(consumer.events.REBALANCE, ({ payload }) => {
      console.log(`[Consumer-${consumerId}] ⚖️  Rebalancing...`);
    });

    // Run consumer
    await consumer.run({
      autoCommit: false,
      eachMessage: async (payload: EachMessagePayload) => {
        const { partition, message } = payload;

        // Log partition assignment on first message
        if (stats.messageCount === 0) {
          const assignment = consumer.assignment();
          assignedPartitions = assignment
            .filter((a) => a.topic === 'order-events')
            .map((a) => a.partition)
            .sort((a, b) => a - b);
          console.log(`[Consumer-${consumerId}] Assigned partitions: ${JSON.stringify(assignedPartitions)}\n`);
        }

        const value = message.value?.toString();
        if (value) {
          const order: OrderEvent = JSON.parse(value);
          stats.partitionCounts[partition] = (stats.partitionCounts[partition] || 0) + 1;
          stats.messageCount++;

          console.log(
            `[Consumer-${consumerId}] 📦 P${partition} | ` +
            `Offset: ${message.offset.toString().padStart(3)} | ` +
            `Customer: ${order.customer_id} | ` +
            `Order: ${order.order_id}`
          );

          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Commit offset
          await consumer.commitOffsets([
            {
              topic: 'order-events',
              partition: partition,
              offset: (parseInt(message.offset) + 1).toString(),
            },
          ]);
        }
      },
    });
  } catch (error) {
    if (error.name !== 'KafkaJSNumberOfRetriesExceeded') {
      console.error(`[Consumer-${consumerId}] ❌ Error:`, error);
    }
  } finally {
    console.log(
      `\n[Consumer-${consumerId}] Processed ${stats.messageCount} messages ` +
      `from partitions: ${JSON.stringify(stats.partitionCounts)}`
    );
    await consumer.disconnect();
  }
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandler(consumerId: number, consumer: Consumer): void {
  const shutdown = async (signal: string) => {
    console.log(`\n[Consumer-${consumerId}] ${signal} received. Shutting down...`);
    try {
      await consumer.disconnect();
      console.log(`[Consumer-${consumerId}] ✅ Disconnected`);
      process.exit(0);
    } catch (error) {
      console.error(`[Consumer-${consumerId}] ❌ Shutdown error:`, error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Get consumer ID from command line argument
  const consumerId = parseInt(process.argv[2] || '1');

  if (isNaN(consumerId) || consumerId < 1) {
    console.error('Usage: ts-node consumer_group.ts <consumer_id>');
    console.error('Example: ts-node consumer_group.ts 1');
    process.exit(1);
  }

  try {
    await consumeOrders(consumerId);
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

export { createConsumer, consumeOrders, OrderEvent };
