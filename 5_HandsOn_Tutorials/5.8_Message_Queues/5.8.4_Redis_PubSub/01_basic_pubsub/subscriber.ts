#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

// Global flag for graceful shutdown
let running = true;

interface MessageData {
  event?: string;
  user_id?: number;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Handle shutdown signals gracefully
 */
function setupSignalHandlers(): void {
  process.on('SIGINT', () => {
    console.log('\nShutting down subscriber...');
    running = false;
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down subscriber...');
    running = false;
  });
}

/**
 * Create Redis client for subscribing
 */
async function createRedisClient(): Promise<RedisClientType> {
  const client = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
      connectTimeout: 5000,
      keepAlive: true,
    },
  });

  client.on('error', (err) => console.error('Redis Client Error:', err));

  await client.connect();
  return client;
}

/**
 * Process received message
 */
function messageHandler(channel: string, message: string): void {
  console.log(`\n[${channel}] Received message:`);

  // Try to parse as JSON
  try {
    const parsedData: MessageData = JSON.parse(message);
    console.log(JSON.stringify(parsedData, null, 2));
  } catch (error) {
    // Not JSON, print as string
    console.log(message);
  }
}

/**
 * Subscribe to channels and listen for messages
 */
async function subscribeToChannels(
  client: RedisClientType,
  channels: string[]
): Promise<void> {
  console.log(`Listening to channels: ${channels.join(', ')}`);
  console.log('Press Ctrl+C to stop\n');

  // Subscribe to channels
  for (const channel of channels) {
    await client.subscribe(channel, (message, channel) => {
      messageHandler(channel, message);
    });
    console.log(`Subscribed to channel: ${channel}`);
  }

  // Keep process alive while running
  while (running) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Unsubscribe from all channels
  for (const channel of channels) {
    await client.unsubscribe(channel);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  setupSignalHandlers();

  let client: RedisClientType | null = null;

  try {
    // Connect to Redis
    client = await createRedisClient();
    await client.ping();
    console.log('Connected to Redis successfully!\n');

    // Subscribe to multiple channels
    const channels = ['news', 'events', 'updates'];
    await subscribeToChannels(client, channels);

    console.log('Subscriber stopped.');
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

export { createRedisClient, subscribeToChannels, messageHandler };
