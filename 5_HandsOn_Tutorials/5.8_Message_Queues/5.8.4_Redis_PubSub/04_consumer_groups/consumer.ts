#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

let running = true;

interface MessageFields {
  task_type?: string;
  data?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Setup signal handlers
 */
function setupSignalHandlers(): void {
  process.on('SIGINT', () => {
    console.log('\nShutting down consumer...');
    running = false;
  });
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
 * Setup consumer group if it doesn't exist
 */
async function setupConsumerGroup(
  client: RedisClientType,
  streamName: string,
  groupName: string
): Promise<void> {
  try {
    await client.xGroupCreate(streamName, groupName, '0', {
      MKSTREAM: true,
    });
    console.log(`Created consumer group '${groupName}'`);
  } catch (error: any) {
    if (error.message && error.message.includes('BUSYGROUP')) {
      console.log(`Consumer group '${groupName}' already exists`);
    } else {
      throw error;
    }
  }
}

/**
 * Process a message (simulate work)
 */
async function processMessage(
  messageId: string,
  fields: MessageFields
): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log(`Processing message: ${messageId}`);
  console.log(`Fields: ${JSON.stringify(fields, null, 2)}`);

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Try to parse JSON data
  if (fields.data) {
    try {
      const data = JSON.parse(fields.data);
      console.log(`Parsed data: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      // Not JSON
    }
  }

  console.log(`Completed processing: ${messageId}`);
  console.log('='.repeat(60));
  return true;
}

/**
 * Consume messages from stream as part of group
 */
async function consumeMessages(
  client: RedisClientType,
  streamName: string,
  groupName: string,
  consumerName: string
): Promise<void> {
  console.log(`Consumer '${consumerName}' starting...`);
  console.log(`Stream: ${streamName}, Group: ${groupName}\n`);

  while (running) {
    try {
      // Read messages (block for 1 second)
      const messages = await client.xReadGroup(
        groupName,
        consumerName,
        { key: streamName, id: '>' },
        {
          COUNT: 1,
          BLOCK: 1000,
        }
      );

      if (!messages || messages.length === 0) {
        continue;
      }

      for (const message of messages) {
        for (const entry of message.messages) {
          // Process message
          const success = await processMessage(
            entry.id,
            entry.message as MessageFields
          );

          if (success) {
            // Acknowledge message
            await client.xAck(streamName, groupName, entry.id);
            console.log(`✓ Acknowledged: ${entry.id}\n`);
          } else {
            console.log(`✗ Failed to process: ${entry.id}\n`);
          }
        }
      }
    } catch (error: any) {
      if (!error.message || !error.message.includes('BLOCK')) {
        console.error('Redis error:', error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  setupSignalHandlers();

  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: ts-node consumer.ts <stream> <group> <consumer_name>');
    process.exit(1);
  }

  const streamName = args[0];
  const groupName = args[1];
  const consumerName = args[2];

  let client: RedisClientType | null = null;

  try {
    client = await createRedisClient();
    await client.ping();
    console.log('Connected to Redis\n');

    // Setup consumer group
    await setupConsumerGroup(client, streamName, groupName);

    // Start consuming
    await consumeMessages(client, streamName, groupName, consumerName);

    console.log(`Consumer '${consumerName}' stopped`);
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

export {
  createRedisClient,
  setupConsumerGroup,
  processMessage,
  consumeMessages,
};
