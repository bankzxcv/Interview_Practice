import {
  connect,
  NatsConnection,
  JetStreamClient,
  StringCodec,
  PubAck,
  headers
} from 'nats';
import * as crypto from 'crypto';

/**
 * Order message interface
 */
interface OrderMessage {
  order_id: string;
  amount: number;
  timestamp: string;
}

/**
 * Exactly-once publisher example
 * Demonstrates message deduplication using message IDs
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js: JetStreamClient = nc.jetstream();
    const sc = StringCodec();

    console.log('Publishing with exactly-once semantics...\n');

    // Simulate publishing the same message twice
    for (let attempt = 1; attempt <= 2; attempt++) {
      const order: OrderMessage = {
        order_id: 'ORD-UNIQUE-001',
        amount: 500.0,
        timestamp: new Date().toISOString()
      };

      // Use message ID for deduplication
      const msgId = crypto
        .createHash('sha256')
        .update(order.order_id)
        .digest('hex')
        .substring(0, 16);

      console.log(`Attempt ${attempt}:`);
      console.log(`  Publishing order: ${order.order_id}`);
      console.log(`  Message ID: ${msgId}`);

      // Create headers with message ID
      const h = headers();
      h.set('Nats-Msg-Id', msgId);

      // Publish with deduplication ID
      const ack: PubAck = await js.publish(
        'orders.created',
        sc.encode(JSON.stringify(order)),
        { headers: h }
      );

      console.log(`  Stream seq: ${ack.seq}`);
      console.log(`  Duplicate: ${ack.duplicate}`);
      console.log();
    }

    console.log('Note: Second publish is marked as duplicate!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the exactly-once publisher
main().catch(console.error);
