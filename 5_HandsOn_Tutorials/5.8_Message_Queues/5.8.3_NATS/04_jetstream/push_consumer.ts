import {
  connect,
  NatsConnection,
  JetStreamClient,
  StringCodec,
  JsMsg,
  ConsumerOpts
} from 'nats';

/**
 * Order message interface
 */
interface OrderMessage {
  order_id: string;
  customer: string;
  amount: number;
  timestamp: string;
}

/**
 * Push consumer example
 * Receives messages automatically as they arrive
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js: JetStreamClient = nc.jetstream();
    const sc = StringCodec();

    console.log('Push Consumer started\n');

    let processed = 0;

    // Create consumer options
    const opts: ConsumerOpts = {
      durable_name: 'orders-push-consumer',
      ack_policy: 1, // AckExplicit
      deliver_to: 'orders-push-inbox',
    };

    // Subscribe as push consumer
    const sub = await js.subscribe('orders.*', opts);

    console.log('Waiting for messages (Ctrl+C to exit)...\n');

    // Process messages as they arrive
    for await (const msg of sub) {
      // Process message
      const data: string = sc.decode(msg.data);
      const order: OrderMessage = JSON.parse(data);

      console.log(`Received: ${order.order_id}`);
      console.log(`  Sequence: ${msg.seq}`);
      console.log(`  Delivered: ${msg.info.delivered} time(s)`);

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Acknowledge
      msg.ack();
      console.log('  ✓ Acknowledged\n');

      processed++;
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Error:', err);
    }
  } finally {
    await nc.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

// Run the push consumer
main().catch(console.error);
