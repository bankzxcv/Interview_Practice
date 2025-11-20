import {
  connect,
  NatsConnection,
  JetStreamManager,
  JetStreamClient,
  StringCodec,
  StorageType
} from 'nats';

/**
 * Replicated JetStream stream example
 * Demonstrates creating a stream with replication across cluster nodes
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({
    servers: [
      'nats://localhost:4222',
      'nats://localhost:4223',
      'nats://localhost:4224'
    ]
  });

  try {
    const jsm: JetStreamManager = await nc.jetstreamManager();
    const js: JetStreamClient = nc.jetstream();
    const sc = StringCodec();

    console.log('Creating replicated stream...\n');

    // Create stream with 3 replicas
    const streamConfig = {
      name: 'REPLICATED_EVENTS',
      subjects: ['events.*'],
      storage: StorageType.File,
      num_replicas: 3, // Replicate across 3 nodes
      max_msgs: 10000
    };

    try {
      await jsm.streams.add(streamConfig);
      console.log('✓ Created replicated stream with 3 replicas\n');
    } catch (err) {
      console.log(`Stream exists or error: ${err.message}\n`);
    }

    // Get stream info
    const info = await jsm.streams.info('REPLICATED_EVENTS');
    console.log(`Stream: ${info.config.name}`);
    console.log(`Replicas: ${info.config.num_replicas}`);

    if (info.cluster) {
      console.log('Cluster:');
      console.log(`  Leader: ${info.cluster.leader || 'unknown'}`);
      if (info.cluster.replicas) {
        console.log('  Replicas:');
        for (const replica of info.cluster.replicas) {
          console.log(`    - ${replica.name} (current: ${replica.current}, active: ${replica.active})`);
        }
      }
    }

    // Publish messages
    console.log('\nPublishing messages to replicated stream...');
    for (let i = 0; i < 10; i++) {
      const ack = await js.publish('events.test', sc.encode(`Message ${i}`));
      console.log(`Published message ${i} to stream seq ${ack.seq}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the replicated stream example
main().catch(console.error);
