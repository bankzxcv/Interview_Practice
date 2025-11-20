import {
  connect,
  NatsConnection,
  JetStreamClient,
  JetStreamManager,
  StringCodec,
  JsMsg,
  AckPolicy,
  ConsumerConfig
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
 * Pull consumer example
 * Fetches messages on demand from JetStream
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js: JetStreamClient = nc.jetstream();
    const jsm: JetStreamManager = await nc.jetstreamManager();
    const sc = StringCodec();

    // Create consumer configuration
    const consumerConfig: Partial<ConsumerConfig> = {
      durable_name: 'orders-processor',
      ack_policy: AckPolicy.Explicit,
      max_deliver: 3,
      ack_wait: 30_000_000_000, // 30 seconds in nanoseconds
    };

    // Create consumer if it doesn't exist
    try {
      await jsm.consumers.add('ORDERS', consumerConfig);
      console.log('Consumer created\n');
    } catch (err) {
      console.log('Consumer exists or error:', err.message, '\n');
    }

    console.log('Pull Consumer started - \'orders-processor\'');
    console.log('Fetching messages...\n');

    // Create pull consumer
    const consumer = await js.consumers.get('ORDERS', 'orders-processor');
    let processed = 0;

    while (processed < 10) {
      try {
        // Fetch up to 5 messages
        const messages = await consumer.fetch({ max_messages: 5, expires: 5000 });

        for await (const msg of messages) {
          // Process message
          const data: string = sc.decode(msg.data);
          const order: OrderMessage = JSON.parse(data);

          console.log(`Processing: ${order.order_id}`);
          console.log(`  Metadata: Stream=${msg.info.stream}, Seq=${msg.seq}`);

          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 500));

          // Acknowledge message
          msg.ack();
          console.log('  ✓ Acknowledged\n');

          processed++;
        }

      } catch (err) {
        console.log('No messages available, waiting...\n');
      }
    }

    console.log(`Processed ${processed} messages`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the pull consumer
main().catch(console.error);
