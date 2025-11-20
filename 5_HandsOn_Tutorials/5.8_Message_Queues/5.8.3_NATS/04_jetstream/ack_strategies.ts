import {
  connect,
  NatsConnection,
  JetStreamClient,
  StringCodec
} from 'nats';

/**
 * Acknowledgment strategies example
 * Demonstrates different ways to acknowledge messages
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js: JetStreamClient = nc.jetstream();
    const sc = StringCodec();

    // Publish a test message
    await js.publish('orders.test', sc.encode('Test message'));

    // Create pull consumer
    const consumer = await js.consumers.get('ORDERS', {
      durable_name: 'ack-demo',
      ack_policy: 1, // AckExplicit
    });

    const messages = await consumer.fetch({ max_messages: 1, expires: 5000 });

    for await (const msg of messages) {
      const data: string = sc.decode(msg.data);
      console.log(`Message: ${data}`);
      console.log(`Delivered: ${msg.info.delivered} time(s)\n`);

      console.log('Acknowledgment options:');

      // 1. ACK - Message processed successfully
      console.log('1. msg.ack() - Success, remove from stream');

      // 2. NAK - Redelivery
      console.log('2. msg.nak() - Failed, redeliver immediately');

      // 3. NAK with delay
      console.log('3. msg.nak(5000) - Failed, redeliver in 5 seconds');

      // 4. TERM - Don't redeliver
      console.log('4. msg.term() - Terminate, don\'t redeliver');

      // 5. IN_PROGRESS - Extend ack wait time
      console.log('5. msg.working() - Still processing, extend timeout');

      // For demo, acknowledge the message
      msg.ack();
      console.log('\n✓ Message acknowledged');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the acknowledgment strategies demo
main().catch(console.error);
