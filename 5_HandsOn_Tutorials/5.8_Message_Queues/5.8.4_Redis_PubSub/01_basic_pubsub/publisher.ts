#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';
import { promisify } from 'util';

interface EventData {
  event: string;
  user_id: number;
  timestamp: string;
}

/**
 * Create Redis client with connection pooling and health checks
 */
async function createRedisClient(): Promise<RedisClientType> {
  const client = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
      connectTimeout: 5000,
      keepAlive: 30000,
    },
  });

  client.on('error', (err) => console.error('Redis Client Error:', err));
  client.on('connect', () => console.log('Connecting to Redis...'));
  client.on('ready', () => console.log('Redis client ready'));

  await client.connect();
  return client;
}

/**
 * Publish message to channel and return subscriber count
 */
async function publishMessage(
  client: RedisClientType,
  channel: string,
  message: string
): Promise<number> {
  try {
    const numSubscribers = await client.publish(channel, message);
    console.log(`Published to '${channel}': ${message}`);
    console.log(`Received by ${numSubscribers} subscriber(s)`);
    return numSubscribers;
  } catch (error) {
    console.error(`Error publishing message: ${error}`);
    return 0;
  }
}

/**
 * Sleep utility function
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
    // Connect to Redis
    client = await createRedisClient();

    // Test connection
    const pong = await client.ping();
    console.log('Connected to Redis successfully!');

    // Publish simple messages
    await publishMessage(client, 'news', 'Hello from TypeScript!');
    await sleep(1000);

    // Publish JSON data
    const data: EventData = {
      event: 'user_login',
      user_id: 12345,
      timestamp: new Date().toISOString(),
    };
    await publishMessage(client, 'events', JSON.stringify(data));

    // Publish multiple messages
    for (let i = 0; i < 5; i++) {
      const message = `Message ${i + 1} at ${new Date().toLocaleTimeString()}`;
      await publishMessage(client, 'updates', message);
      await sleep(500);
    }

    console.log('\nPublishing complete!');
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (client) {
      await client.quit();
      console.log('Redis connection closed');
    }
  }
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

export { createRedisClient, publishMessage };
