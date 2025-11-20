import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Test NATS cluster connectivity example
 * Demonstrates connecting to multiple servers with automatic failover
 */
async function main(): Promise<void> {
  // Connect to multiple servers (automatic failover)
  const nc: NatsConnection = await connect({
    servers: [
      'nats://localhost:4222',
      'nats://localhost:4223',
      'nats://localhost:4224'
    ],
    name: 'cluster-client'
  });

  console.log(`Connected to: ${nc.getServer()}`);

  const sc = StringCodec();

  try {
    // Subscribe
    const sub: Subscription = nc.subscribe('test.>');

    console.log('Subscribed to test.>');

    // Process messages in background
    const processMessages = (async () => {
      for await (const msg: Msg of sub) {
        const data: string = sc.decode(msg.data);
        console.log(`Received: ${data} on ${msg.subject}`);
      }
    })();

    // Publish messages
    for (let i = 0; i < 10; i++) {
      nc.publish('test.message', sc.encode(`Message ${i}`));
      console.log(`Published: Message ${i}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Unsubscribe and wait for processing to complete
    sub.unsubscribe();
    await processMessages;

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Error:', err);
    }
  } finally {
    await nc.close();
  }
}

// Run the cluster test
main().catch(console.error);
