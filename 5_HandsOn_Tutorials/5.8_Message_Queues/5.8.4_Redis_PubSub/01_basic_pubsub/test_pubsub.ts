#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * Test basic publish/subscribe functionality
 */
async function testBasicPubSub(): Promise<TestResult> {
  console.log('Test 1: Basic Pub/Sub');

  const publisher = createClient({ socket: { host: 'localhost', port: 6379 } });
  const subscriber = createClient({ socket: { host: 'localhost', port: 6379 } });

  try {
    await publisher.connect();
    await subscriber.connect();

    const receivedMessages: string[] = [];
    const testChannel = 'test-channel';

    // Subscribe and collect messages
    await subscriber.subscribe(testChannel, (message) => {
      receivedMessages.push(message);
    });

    // Wait for subscription to be established
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Publish messages
    await publisher.publish(testChannel, 'Message 1');
    await publisher.publish(testChannel, 'Message 2');
    await publisher.publish(testChannel, 'Message 3');

    // Wait for messages to be received
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify
    await subscriber.unsubscribe(testChannel);
    await publisher.quit();
    await subscriber.quit();

    if (receivedMessages.length === 3) {
      console.log('✓ Test passed\n');
      return { name: 'Basic Pub/Sub', passed: true };
    } else {
      const error = `Expected 3 messages, got ${receivedMessages.length}`;
      console.log(`✗ Test failed: ${error}\n`);
      return { name: 'Basic Pub/Sub', passed: false, error };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    await publisher.quit().catch(() => {});
    await subscriber.quit().catch(() => {});
    return {
      name: 'Basic Pub/Sub',
      passed: false,
      error: String(error),
    };
  }
}

/**
 * Test PUBSUB commands
 */
async function testChannelInfo(): Promise<TestResult> {
  console.log('Test 2: Channel Information');

  const client = createClient({ socket: { host: 'localhost', port: 6379 } });
  const subscriber = createClient({ socket: { host: 'localhost', port: 6379 } });

  try {
    await client.connect();
    await subscriber.connect();

    // Subscribe to channels
    await subscriber.subscribe('test1', () => {});
    await subscriber.subscribe('test2', () => {});

    // Wait for subscriptions
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check channels using PUBSUB CHANNELS
    const channels = await client.sendCommand(['PUBSUB', 'CHANNELS']) as string[];

    // Verify
    await subscriber.unsubscribe('test1');
    await subscriber.unsubscribe('test2');
    await client.quit();
    await subscriber.quit();

    const hasTest1 = channels.includes('test1');
    const hasTest2 = channels.includes('test2');

    if (hasTest1 && hasTest2) {
      console.log('✓ Test passed\n');
      return { name: 'Channel Information', passed: true };
    } else {
      const error = 'Expected channels not found';
      console.log(`✗ Test failed: ${error}\n`);
      return { name: 'Channel Information', passed: false, error };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    await client.quit().catch(() => {});
    await subscriber.quit().catch(() => {});
    return {
      name: 'Channel Information',
      passed: false,
      error: String(error),
    };
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('Running Pub/Sub Tests\n');

  const results: TestResult[] = [];

  // Run tests
  results.push(await testBasicPubSub());
  results.push(await testChannelInfo());

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('Test Summary:');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testBasicPubSub, testChannelInfo };
