import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Run a single subscriber with a specific name and subject
 */
async function runSubscriber(name: string, subject: string): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log(`[${name}] Subscribed to ${subject}`);

  const sc = StringCodec();

  try {
    const sub: Subscription = nc.subscribe(subject);

    for await (const msg: Msg of sub) {
      const data: string = sc.decode(msg.data);
      console.log(`[${name}] Received on ${msg.subject}: ${data}`);
    }
  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error(`[${name}] Error:`, err);
    }
  } finally {
    await nc.close();
  }
}

/**
 * Multiple subscribers example
 * Demonstrates fan-out pattern where all subscribers receive all messages
 */
async function main(): Promise<void> {
  console.log('Starting multiple subscribers...\n');

  try {
    // Run 3 subscribers in parallel with different subject patterns
    await Promise.all([
      runSubscriber('Subscriber-1', 'events.>'),
      runSubscriber('Subscriber-2', 'events.user.*'),
      runSubscriber('Subscriber-3', 'events.user.login')
    ]);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutdown complete');
  process.exit(0);
});

// Run the subscribers
main().catch(console.error);
