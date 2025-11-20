import {
  connect,
  NatsConnection,
  JetStreamManager,
  JetStreamClient,
  StringCodec,
  RetentionPolicy,
  StorageType
} from 'nats';

/**
 * Retention policy demonstration
 * Shows work queue retention where messages are deleted after acknowledgment
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const jsm: JetStreamManager = await nc.jetstreamManager();
    const js: JetStreamClient = nc.jetstream();
    const sc = StringCodec();

    // Create work queue stream
    const streamConfig = {
      name: 'WORKQUEUE',
      subjects: ['work.*'],
      retention: RetentionPolicy.Workqueue, // Messages deleted after ack
      storage: StorageType.Memory,
    };

    try {
      await jsm.streams.add(streamConfig);
      console.log('✓ Created WORKQUEUE stream\n');
    } catch (err) {
      console.log('✓ WORKQUEUE stream already exists\n');
    }

    // Publish 10 messages
    console.log('Publishing 10 work items...');
    for (let i = 1; i <= 10; i++) {
      await js.publish('work.task', sc.encode(`Task ${i}`));
      console.log(`  Published: Task ${i}`);
    }

    // Check stream
    let info = await jsm.streams.info('WORKQUEUE');
    console.log(`\nMessages in stream: ${info.state.messages}`);

    // Consume messages
    console.log('\nConsuming messages...');
    const consumer = await js.consumers.get('WORKQUEUE', {
      durable_name: 'worker',
      ack_policy: 1, // AckExplicit
    });

    const messages = await consumer.fetch({ max_messages: 10, expires: 5000 });
    for await (const msg of messages) {
      const data: string = sc.decode(msg.data);
      console.log(`  Received: ${data}`);
      msg.ack();
      console.log('    Acknowledged');
    }

    // Check stream again - should be empty (work queue)
    info = await jsm.streams.info('WORKQUEUE');
    console.log(`\nMessages in stream after consumption: ${info.state.messages}`);
    console.log('(Work queue deletes messages after ack)');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the retention demo
main().catch(console.error);
