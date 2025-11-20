import {
  connect,
  NatsConnection,
  JetStreamClient,
  StringCodec,
  ConsumerOpts,
  DeliverPolicy,
  AckPolicy
} from 'nats';

/**
 * Replay consumer example
 * Demonstrates replaying messages from the beginning of a stream
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js: JetStreamClient = nc.jetstream();
    const sc = StringCodec();

    console.log('Replaying ALL messages from the beginning...\n');

    let count = 0;

    // Consumer options to replay from start
    const opts: ConsumerOpts = {
      durable_name: 'replay-consumer',
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All, // Start from beginning
    };

    // Subscribe to replay messages
    const sub = await js.subscribe('orders.*', opts);

    // Set timeout to stop after 10 seconds
    const timeout = setTimeout(() => {
      sub.unsubscribe();
    }, 10000);

    // Process replayed messages
    for await (const msg of sub) {
      count++;
      const data: string = sc.decode(msg.data);

      console.log(`[${count}] Seq ${msg.seq}: ${data}`);
      msg.ack();
    }

    clearTimeout(timeout);
    console.log(`\nReplayed ${count} messages`);

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Error:', err);
    }
  } finally {
    await nc.close();
  }
}

// Run the replay consumer
main().catch(console.error);
