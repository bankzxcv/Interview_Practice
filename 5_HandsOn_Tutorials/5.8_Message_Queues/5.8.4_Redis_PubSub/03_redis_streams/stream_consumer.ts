#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

let running = true;

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
 * Parse stream entry
 */
function parseEntry(entryId: string, fields: Record<string, string>): void {
  console.log('\n' + '='.repeat(60));
  console.log(`ID: ${entryId}`);

  // Parse timestamp from ID
  const timestampMs = parseInt(entryId.split('-')[0]);
  const dt = new Date(timestampMs);
  console.log(
    `Time: ${dt.toISOString().replace('T', ' ').substring(0, 23)}`
  );

  console.log('Fields:');
  for (const [key, value] of Object.entries(fields)) {
    console.log(`  ${key}: ${value}`);

    // Try to parse JSON data
    if (key === 'data') {
      try {
        const parsed = JSON.parse(value);
        console.log('  Parsed data:');
        for (const [k, v] of Object.entries(parsed)) {
          console.log(`    ${k}: ${v}`);
        }
      } catch (error) {
        // Not JSON
      }
    }
  }

  console.log('='.repeat(60));
}

/**
 * Read all messages from beginning
 */
async function consumeAllMessages(
  client: RedisClientType,
  streamName: string
): Promise<void> {
  console.log(`Reading all messages from '${streamName}'...\n`);

  // XREAD from beginning (ID 0)
  const messages = await client.xRead(
    { key: streamName, id: '0' },
    { COUNT: 100 }
  );

  if (!messages || messages.length === 0) {
    console.log('No messages in stream');
    return;
  }

  for (const message of messages) {
    console.log(`Stream: ${message.name}`);
    for (const entry of message.messages) {
      parseEntry(entry.id, entry.message as Record<string, string>);
    }
  }
}

/**
 * Block and wait for new messages
 */
async function consumeNewMessages(
  client: RedisClientType,
  streamName: string
): Promise<void> {
  console.log(`Waiting for new messages on '${streamName}'...`);
  console.log('Press Ctrl+C to stop\n');

  // Start from the end
  let lastId = '$';

  while (running) {
    try {
      // Block for up to 1 second
      const messages = await client.xRead(
        { key: streamName, id: lastId },
        {
          COUNT: 10,
          BLOCK: 1000,
        }
      );

      if (messages && messages.length > 0) {
        for (const message of messages) {
          for (const entry of message.messages) {
            parseEntry(entry.id, entry.message as Record<string, string>);
            lastId = entry.id; // Update last seen ID
          }
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('BLOCK')) {
        // Timeout, continue
        continue;
      }
      console.error('Redis error:', error);
      break;
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  setupSignalHandlers();

  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: ts-node stream_consumer.ts <stream_name> [all|new]');
    console.log('  all - Read all existing messages');
    console.log('  new - Wait for new messages (blocking)');
    process.exit(1);
  }

  const streamName = args[0];
  const mode = args[1] || 'all';

  let client: RedisClientType | null = null;

  try {
    client = await createRedisClient();
    await client.ping();
    console.log('Connected to Redis\n');

    // Check if stream exists
    if (mode === 'all') {
      const exists = await client.exists(streamName);
      if (exists === 0) {
        console.log(`Stream '${streamName}' does not exist`);
        return;
      }
    }

    if (mode === 'all') {
      await consumeAllMessages(client, streamName);
    } else if (mode === 'new') {
      await consumeNewMessages(client, streamName);
    } else {
      console.log(`Unknown mode: ${mode}`);
    }
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

export { createRedisClient, consumeAllMessages, consumeNewMessages, parseEntry };
