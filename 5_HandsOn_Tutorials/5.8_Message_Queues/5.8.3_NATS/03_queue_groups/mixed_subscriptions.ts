import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Mixed subscriptions example
 * Demonstrates combining regular and queue subscriptions on the same subject
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  const sc = StringCodec();

  console.log('Setup:');
  console.log('  1 Logger (regular) - receives ALL messages');
  console.log('  2 Workers (queue \'processors\') - each receives SOME messages');
  console.log('\nWaiting for messages...\n');

  try {
    // Regular subscriber - gets ALL messages (for logging)
    const loggerSub: Subscription = nc.subscribe('events.order');

    // Queue subscribers - each gets SOME messages (load balanced)
    const worker1Sub: Subscription = nc.subscribe('events.order', { queue: 'processors' });
    const worker2Sub: Subscription = nc.subscribe('events.order', { queue: 'processors' });

    // Process logger messages
    const processLogger = async () => {
      for await (const msg: Msg of loggerSub) {
        const data: string = sc.decode(msg.data);
        console.log(`[LOGGER] Logged: ${data}`);
      }
    };

    // Process worker 1 messages
    const processWorker1 = async () => {
      for await (const msg: Msg of worker1Sub) {
        const data: string = sc.decode(msg.data);
        console.log(`[WORKER-1] Processing: ${data}`);
      }
    };

    // Process worker 2 messages
    const processWorker2 = async () => {
      for await (const msg: Msg of worker2Sub) {
        const data: string = sc.decode(msg.data);
        console.log(`[WORKER-2] Processing: ${data}`);
      }
    };

    // Run all processors concurrently
    await Promise.race([
      processLogger(),
      processWorker1(),
      processWorker2()
    ]);

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Error:', err);
    }
  } finally {
    await nc.close();
    console.log('\nShutdown');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

// Run the mixed subscriptions demo
main().catch(console.error);
