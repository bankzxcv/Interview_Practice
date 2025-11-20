import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Order message interface
 */
interface OrderMessage {
  order_id: string;
  product: string;
  quantity: number;
  timestamp: string;
}

/**
 * Basic NATS subscriber example
 * Subscribes to 'orders.created' subject
 */
async function main(): Promise<void> {
  // Connect to NATS
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Connected to NATS');
  console.log("Listening on 'orders.created'...\n");

  // String codec for encoding/decoding messages
  const sc = StringCodec();

  try {
    // Subscribe to subject
    const sub: Subscription = nc.subscribe('orders.created');

    console.log('Waiting for messages (Ctrl+C to exit)...\n');

    // Process messages
    for await (const msg: Msg of sub) {
      const data: string = sc.decode(msg.data);
      const message: OrderMessage = JSON.parse(data);

      console.log(`\n[Received] Subject: ${msg.subject}`);
      console.log(`  Order ID: ${message.order_id}`);
      console.log(`  Product: ${message.product}`);
      console.log(`  Quantity: ${message.quantity}`);
      console.log(`  Timestamp: ${message.timestamp}`);
    }
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
