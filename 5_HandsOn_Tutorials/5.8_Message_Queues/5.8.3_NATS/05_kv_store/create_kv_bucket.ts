import { connect, NatsConnection, KV } from 'nats';

/**
 * Create KV bucket example
 * Demonstrates creating a Key-Value bucket in JetStream
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();

    console.log('Creating KV bucket...\n');

    // Create KV bucket
    const kv: KV = await js.views.kv('CONFIG', {
      description: 'Application configuration',
      max_value_size: 1024, // 1KB max per value
      history: 10, // Keep last 10 revisions
      ttl: 0, // No TTL (keys don't expire)
    });

    console.log(`✓ Created KV bucket: CONFIG\n`);

    // Get bucket status
    const status = await kv.status();
    console.log('Bucket Info:');
    console.log(`  Bucket: ${status.bucket}`);
    console.log(`  Values: ${status.values}`);
    console.log(`  History: ${status.history}`);
    console.log(`  TTL: ${status.ttl}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the KV bucket creator
main().catch(console.error);
