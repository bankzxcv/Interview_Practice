import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Kubernetes cluster test example
 * Tests connectivity to NATS cluster running in Kubernetes
 */
async function main(): Promise<void> {
  // Connect to NATS in Kubernetes
  // In-cluster: use service DNS (e.g., nats://nats-client.nats-system.svc.cluster.local:4222)
  // From outside: use LoadBalancer IP or NodePort
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';

  const nc: NatsConnection = await connect({ servers: natsUrl });

  console.log(`Connected to NATS: ${nc.getServer()}`);

  const sc = StringCodec();

  try {
    // Subscribe to test subject
    const sub: Subscription = nc.subscribe('k8s.test');

    // Process messages in background
    const processMessages = (async () => {
      for await (const msg: Msg of sub) {
        const data: string = sc.decode(msg.data);
        console.log(`Received: ${data}`);
      }
    })();

    // Publish test messages
    for (let i = 0; i < 10; i++) {
      nc.publish('k8s.test', sc.encode(`Message ${i} from TypeScript`));
      console.log(`Published: Message ${i} from TypeScript`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cleanup
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

// Run the Kubernetes cluster test
main().catch(console.error);
