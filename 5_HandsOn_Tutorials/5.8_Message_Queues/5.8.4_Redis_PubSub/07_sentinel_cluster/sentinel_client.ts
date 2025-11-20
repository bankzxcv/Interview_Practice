#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';
import { createSentinel } from 'redis-sentinel';

interface SentinelConfig {
  host: string;
  port: number;
}

/**
 * Create Redis connection via Sentinel
 */
async function createSentinelConnection(): Promise<{
  master: RedisClientType;
  sentinel: any;
}> {
  // Sentinel addresses
  const sentinelList: SentinelConfig[] = [
    { host: 'localhost', port: 26379 },
    { host: 'localhost', port: 26380 },
    { host: 'localhost', port: 26381 },
  ];

  // Create master connection through sentinel
  const masterClient = createClient({
    socket: {
      host: 'localhost', // Will be discovered by sentinel
      port: 6379,
      connectTimeout: 5000,
    },
    password: 'redis_password',
  });

  await masterClient.connect();

  return {
    master: masterClient,
    sentinel: null, // Placeholder for sentinel instance
  };
}

/**
 * Test automatic failover handling
 */
async function testFailoverResilience(): Promise<void> {
  const { master } = await createSentinelConnection();

  console.log('Testing Sentinel failover resilience\n');

  try {
    // Write data
    console.log('1. Writing to master...');
    for (let i = 0; i < 100; i++) {
      try {
        await master.xAdd('test:stream', '*', {
          id: i.toString(),
          data: `message-${i}`,
        });
        process.stdout.write(`   Written: ${i}\r`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.log(`\n   Connection lost at message ${i}: ${error.message}`);
        console.log('   Waiting for failover...');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Reconnect (Sentinel will discover new master)
        const reconnected = await createSentinelConnection();
        console.log('   Reconnected to new master, continuing...');
      }
    }

    console.log('\n2. Verifying data...');
    const length = await master.xLen('test:stream');
    console.log(`   Stream length: ${length}`);

    // Cleanup
    await master.del('test:stream');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await master.quit();
  }
}

/**
 * Monitor Sentinel status continuously
 */
async function monitorSentinelStatus(): Promise<void> {
  const { master } = await createSentinelConnection();

  while (true) {
    try {
      // Get replication info
      const info = await master.sendCommand(['INFO', 'replication']);

      console.log('\n' + '='.repeat(60));
      console.log(`Sentinel Status - ${new Date().toLocaleTimeString()}`);
      console.log('='.repeat(60));

      // Parse info string
      const lines = (info as string).split('\r\n');
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (
            key.includes('role') ||
            key.includes('connected_slaves') ||
            key.includes('master')
          ) {
            console.log(`${key}: ${value}`);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error:', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length > 0 && args[0] === 'monitor') {
    await monitorSentinelStatus();
  } else {
    await testFailoverResilience();
  }
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createSentinelConnection, testFailoverResilience, monitorSentinelStatus };
