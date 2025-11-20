#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

interface EventPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
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
 * Publish structured event
 */
async function publishEvent(
  client: RedisClientType,
  channel: string,
  eventType: string,
  data: Record<string, any>
): Promise<number> {
  const message: EventPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  const numSubs = await client.publish(channel, JSON.stringify(message));
  console.log(`Published to '${channel}': ${eventType} (${numSubs} subscribers)`);
  return numSubs;
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
    console.log('Publishing to various channels...\n');

    // User events (matches user:*)
    await publishEvent(client, 'user:123', 'login', { username: 'john_doe' });
    await sleep(500);

    await publishEvent(client, 'user:456', 'logout', {
      username: 'jane_smith',
    });
    await sleep(500);

    // Order events (matches order:*)
    await publishEvent(client, 'order:789', 'created', {
      order_id: '789',
      total: 99.99,
      items: 3,
    });
    await sleep(500);

    await publishEvent(client, 'order:790', 'shipped', {
      order_id: '790',
      tracking: 'TRACK123',
    });
    await sleep(500);

    // Hierarchical events (matches events:*:*)
    await publishEvent(client, 'events:user:registered', 'user_registered', {
      user_id: 999,
      plan: 'premium',
    });
    await sleep(500);

    await publishEvent(
      client,
      'events:payment:completed',
      'payment_completed',
      {
        amount: 49.99,
        method: 'card',
      }
    );
    await sleep(500);

    // Events that don't match any pattern
    await publishEvent(client, 'system:health', 'heartbeat', { status: 'ok' });

    console.log('\nPublishing complete!');
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

export { createRedisClient, publishEvent };
