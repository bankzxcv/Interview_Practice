#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

let running = true;

interface PatternMessage {
  pattern: string;
  channel: string;
  message: string;
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers(): void {
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    running = false;
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down...');
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
 * Handle pattern subscription message
 */
function handlePatternMessage(
  message: string,
  channel: string,
  pattern: string
): void {
  console.log('\n' + '='.repeat(60));
  console.log(`Pattern:  ${pattern}`);
  console.log(`Channel:  ${channel}`);
  console.log(`Message:  ${message}`);

  // Extract info from channel name
  const parts = channel.split(':');
  if (parts.length >= 2) {
    console.log(`Namespace: ${parts[0]}`);
    console.log(`Resource:  ${parts[1]}`);
  }

  // Try to parse JSON
  try {
    const parsed = JSON.parse(message);
    console.log('Data (parsed):');
    console.log(JSON.stringify(parsed, null, 2));
  } catch (error) {
    // Not JSON, continue
  }

  console.log('='.repeat(60));
}

/**
 * Main function
 */
async function main(): Promise<void> {
  setupSignalHandlers();

  let client: RedisClientType | null = null;

  try {
    client = await createRedisClient();
    await client.ping();
    console.log('Connected to Redis\n');

    // Subscribe to patterns
    const patterns = ['user:*', 'order:*', 'events:*:*'];

    for (const pattern of patterns) {
      await client.pSubscribe(pattern, (message, channel) => {
        handlePatternMessage(message, channel, pattern);
      });
      console.log(`✓ Subscribed to pattern: ${pattern}`);
    }

    console.log(`\nListening to patterns: ${patterns.join(', ')}\n`);

    // Keep running
    while (running) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Unsubscribe
    for (const pattern of patterns) {
      await client.pUnsubscribe(pattern);
    }

    console.log('Subscriber stopped');
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

export { createRedisClient, handlePatternMessage };
