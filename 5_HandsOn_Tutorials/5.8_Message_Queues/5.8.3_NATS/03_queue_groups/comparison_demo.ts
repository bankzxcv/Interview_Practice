import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';
import * as readline from 'readline';

/**
 * Regular subscriber - receives ALL messages
 */
async function regularSubscriber(subscriberId: string): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  const sc = StringCodec();
  let count = 0;

  try {
    // Regular subscription (no queue)
    const sub: Subscription = nc.subscribe('demo.topic');
    console.log(`[Regular Sub ${subscriberId}] Started (no queue group)`);

    for await (const msg: Msg of sub) {
      count++;
      const data: string = sc.decode(msg.data);
      console.log(`[Regular Sub ${subscriberId}] Message #${count}: ${data}`);
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error(`[Regular Sub ${subscriberId}] Error:`, err);
    }
  } finally {
    await nc.close();
  }
}

/**
 * Queue subscriber - receives SOME messages (load balanced)
 */
async function queueSubscriber(subscriberId: string): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  const sc = StringCodec();
  let count = 0;

  try {
    // Queue subscription
    const sub: Subscription = nc.subscribe('demo.topic', { queue: 'workers' });
    console.log(`[Queue Sub ${subscriberId}] Started (queue: workers)`);

    for await (const msg: Msg of sub) {
      count++;
      const data: string = sc.decode(msg.data);
      console.log(`[Queue Sub ${subscriberId}] Message #${count}: ${data}`);
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error(`[Queue Sub ${subscriberId}] Error:`, err);
    }
  } finally {
    await nc.close();
  }
}

/**
 * Queue groups vs regular subscriptions comparison
 */
async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Choose mode (1=Regular, 2=Queue): ', async (mode) => {
    rl.close();

    try {
      if (mode === '1') {
        // Start 3 regular subscribers
        console.log('\nStarting 3 REGULAR subscribers...\n');
        await Promise.all([
          regularSubscriber('A'),
          regularSubscriber('B'),
          regularSubscriber('C')
        ]);
      } else {
        // Start 3 queue subscribers
        console.log('\nStarting 3 QUEUE subscribers...\n');
        await Promise.all([
          queueSubscriber('A'),
          queueSubscriber('B'),
          queueSubscriber('C')
        ]);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutdown complete');
  process.exit(0);
});

// Run the comparison demo
main().catch(console.error);
