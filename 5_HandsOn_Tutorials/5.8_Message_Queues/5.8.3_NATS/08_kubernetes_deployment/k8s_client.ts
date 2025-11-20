import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Kubernetes NATS client example
 * Demonstrates connecting to NATS from within a Kubernetes pod
 */
async function main(): Promise<void> {
  // In-cluster: use service DNS
  // nats://nats-client.nats-system.svc.cluster.local:4222

  // From outside: use LoadBalancer IP or NodePort
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';

  console.log(`Connecting to NATS at: ${natsUrl}`);

  const nc: NatsConnection = await connect({ servers: natsUrl });

  console.log(`Connected to NATS: ${nc.getServer()}`);

  const sc = StringCodec();

  try {
    // Subscribe to Kubernetes test subject
    const sub: Subscription = nc.subscribe('k8s.test');

    console.log('Subscribed to k8s.test');

    // Process messages in background
    const processMessages = (async () => {
      for await (const msg: Msg of sub) {
        const data: string = sc.decode(msg.data);
        console.log(`Received: ${data}`);
      }
    })();

    // Publish test messages
    for (let i = 0; i < 10; i++) {
      nc.publish('k8s.test', sc.encode(`Message ${i} from K8s TypeScript client`));
      console.log(`Published: Message ${i} from K8s TypeScript client`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Wait for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cleanup
    sub.unsubscribe();
    await processMessages;

    console.log('\nTest completed successfully!');

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Error:', err);
    }
  } finally {
    await nc.close();
    console.log('Connection closed');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Run the Kubernetes client
main().catch(console.error);
