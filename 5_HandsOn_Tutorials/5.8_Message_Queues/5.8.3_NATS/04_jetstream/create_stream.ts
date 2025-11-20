import { connect, NatsConnection, JetStreamManager, StorageType, RetentionPolicy } from 'nats';

/**
 * Create JetStream stream example
 * Demonstrates creating and configuring a JetStream stream
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    // Get JetStream manager
    const jsm: JetStreamManager = await nc.jetstreamManager();

    console.log('Creating JetStream stream...\n');

    // Create stream configuration
    const streamConfig = {
      name: 'ORDERS',
      subjects: ['orders.*'],
      retention: RetentionPolicy.Limits,
      storage: StorageType.File,
      max_msgs: 10000,
      max_bytes: 1024 * 1024 * 100, // 100MB
      max_age: 86400_000_000_000, // 24 hours in nanoseconds
      max_msg_size: 1024 * 1024, // 1MB per message
      num_replicas: 1,
    };

    // Create or update stream
    try {
      await jsm.streams.add(streamConfig);
      console.log('✓ Stream \'ORDERS\' created successfully\n');
    } catch (err) {
      console.log('Stream already exists or error:', err.message, '\n');
    }

    // Get stream info
    const streamInfo = await jsm.streams.info('ORDERS');

    console.log('Stream Info:');
    console.log(`  Name: ${streamInfo.config.name}`);
    console.log(`  Subjects: ${streamInfo.config.subjects.join(', ')}`);
    console.log(`  Storage: ${streamInfo.config.storage}`);
    console.log(`  Retention: ${streamInfo.config.retention}`);
    console.log(`  Messages: ${streamInfo.state.messages}`);
    console.log(`  Bytes: ${streamInfo.state.bytes}`);
    console.log(`  First Seq: ${streamInfo.state.first_seq}`);
    console.log(`  Last Seq: ${streamInfo.state.last_seq}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the stream creator
main().catch(console.error);
