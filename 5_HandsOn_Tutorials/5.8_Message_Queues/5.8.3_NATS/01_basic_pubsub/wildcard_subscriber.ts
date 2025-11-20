import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Wildcard subscription example
 * Demonstrates single-level (*) and multi-level (>) wildcards
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Connected to NATS\n');

  const sc = StringCodec();

  try {
    // Subscribe with single-level wildcard (*)
    const orderSub: Subscription = nc.subscribe('orders.*');

    // Subscribe with multi-level wildcard (>)
    const shippedSub: Subscription = nc.subscribe('orders.shipped.>');

    console.log('Subscribed to:');
    console.log('  1. orders.* (single-level wildcard)');
    console.log('  2. orders.shipped.> (multi-level wildcard)');
    console.log('\nWaiting for messages (Ctrl+C to exit)...\n');

    // Process messages from both subscriptions concurrently
    const processOrderMessages = async () => {
      for await (const msg: Msg of orderSub) {
        const data: string = sc.decode(msg.data);
        console.log(`\n[Order Handler] Subject: ${msg.subject}`);
        console.log(`  Data: ${data}`);
      }
    };

    const processShippedMessages = async () => {
      for await (const msg: Msg of shippedSub) {
        const data: string = sc.decode(msg.data);
        console.log(`\n[Shipped Handler] Subject: ${msg.subject}`);
        console.log(`  Data: ${data}`);
      }
    };

    // Process both subscriptions
    await Promise.race([
      processOrderMessages(),
      processShippedMessages()
    ]);

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Error:', err);
    }
  } finally {
    await nc.close();
    console.log('\nConnection closed');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

// Run the subscriber
main().catch(console.error);
