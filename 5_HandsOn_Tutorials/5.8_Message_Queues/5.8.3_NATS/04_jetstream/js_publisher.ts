import { connect, NatsConnection, JetStreamClient, StringCodec, PubAck } from 'nats';

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
 * JetStream publisher example
 * Publishes messages to a JetStream stream with acknowledgments
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    // Get JetStream client
    const js: JetStreamClient = nc.jetstream();
    const sc = StringCodec();

    console.log('Publishing to JetStream stream \'ORDERS\'...\n');

    for (let i = 1; i <= 10; i++) {
      const order: OrderMessage = {
        order_id: `ORD-${String(i).padStart(5, '0')}`,
        customer: `Customer-${i}`,
        amount: 100.0 * i,
        timestamp: new Date().toISOString()
      };

      // Publish and get acknowledgment
      const ack: PubAck = await js.publish(
        'orders.created',
        sc.encode(JSON.stringify(order))
      );

      console.log(`Published ${order.order_id}`);
      console.log(`  Stream: ${ack.stream}`);
      console.log(`  Sequence: ${ack.seq}`);
      console.log(`  Duplicate: ${ack.duplicate}\n`);

      // Wait 500ms between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('All messages published and acknowledged!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the JetStream publisher
main().catch(console.error);
