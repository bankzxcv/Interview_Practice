#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

interface SubscriberConfig {
  subscriberId: string;
  channels: string[];
}

/**
 * Individual subscriber worker
 */
async function subscriberWorker(
  subscriberId: string,
  channels: string[]
): Promise<void> {
  const client = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
    },
  });

  await client.connect();
  console.log(`Subscriber ${subscriberId} started`);

  // Subscribe to channels
  for (const channel of channels) {
    await client.subscribe(channel, async (message, channelName) => {
      console.log(
        `[Subscriber ${subscriberId}] Channel: ${channelName}, Data: ${message}`
      );

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  }

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log(`\nSubscriber ${subscriberId} stopped`);
    await client.quit();
    process.exit(0);
  });
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: ts-node subscriber_multiple.ts <subscriber_id>');
    process.exit(1);
  }

  const subscriberId = args[0];
  const channels = ['notifications', 'alerts'];

  try {
    await subscriberWorker(subscriberId, channels);
  } catch (error) {
    console.error(`Error in subscriber ${subscriberId}:`, error);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

export { subscriberWorker };
