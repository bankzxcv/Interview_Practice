#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

interface TaskData {
  task_type: string;
  data: string;
  timestamp: string;
}

/**
 * Create Redis client
 */
async function createRedisClient(): Promise<RedisClientType> {
  const client = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
    },
  });

  await client.connect();
  return client;
}

/**
 * Publish task to stream
 */
async function publishTask(
  client: RedisClientType,
  streamName: string,
  taskType: string,
  data: Record<string, any>
): Promise<string> {
  const message: TaskData = {
    task_type: taskType,
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  };

  const messageId = await client.xAdd(streamName, '*', message as any);
  console.log(`Published task ${messageId}: ${taskType}`);
  return messageId;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main(): Promise<void> {
  let client: RedisClientType | null = null;

  try {
    client = await createRedisClient();

    const streamName = 'tasks';

    console.log(`Publishing tasks to stream '${streamName}'...\n`);

    // Publish various tasks
    const tasks: Array<[string, Record<string, any>]> = [
      ['process_order', { order_id: 101, amount: 99.99 }],
      ['send_email', { to: 'user@example.com', subject: 'Welcome' }],
      ['generate_report', { report_type: 'monthly', month: 11 }],
      ['process_payment', { payment_id: 202, amount: 49.99 }],
      ['update_inventory', { product_id: 303, quantity: -5 }],
      ['send_notification', { user_id: 404, message: 'Order shipped' }],
      ['backup_database', { database: 'production' }],
      ['cleanup_temp', { older_than_days: 7 }],
    ];

    for (const [taskType, data] of tasks) {
      await publishTask(client, streamName, taskType, data);
      await sleep(500);
    }

    console.log('\nPublishing complete!');

    // Get stream length
    const length = await client.xLen(streamName);
    console.log(`Stream length: ${length}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.quit();
    }
  }
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

export { createRedisClient, publishTask };
