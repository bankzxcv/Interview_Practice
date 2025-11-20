import { connect, NatsConnection, StringCodec } from 'nats';

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
 * Basic NATS publisher example
 * Publishes order messages to 'orders.created' subject
 */
async function main(): Promise<void> {
  // Connect to NATS server
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Connected to NATS');
  console.log("Publishing messages to 'orders.created'...\n");

  // String codec for encoding/decoding messages
  const sc = StringCodec();

  try {
    // Publish 10 messages
    for (let i = 0; i < 10; i++) {
      const message: OrderMessage = {
        order_id: `ORD-${String(i).padStart(5, '0')}`,
        product: 'Widget',
        quantity: i + 1,
        timestamp: new Date().toISOString()
      };

      // Publish message
      nc.publish('orders.created', sc.encode(JSON.stringify(message)));
      console.log(`Published: ${message.order_id}`);

      // Wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Flush to ensure all messages are sent
    await nc.flush();

    console.log('\nAll messages published!');
  } catch (err) {
    console.error('Error publishing:', err);
  } finally {
    // Close connection
    await nc.close();
    console.log('Connection closed');
  }
}

// Run the publisher
main().catch(console.error);
