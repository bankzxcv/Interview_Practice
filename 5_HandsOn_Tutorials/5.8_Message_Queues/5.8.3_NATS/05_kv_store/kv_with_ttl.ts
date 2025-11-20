import { connect, NatsConnection, KV, StringCodec } from 'nats';

/**
 * KV with TTL example
 * Demonstrates time-to-live for keys
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const sc = StringCodec();

    console.log('Creating KV bucket with TTL...\n');

    // Create bucket with TTL (10 seconds)
    const kv: KV = await js.views.kv('SESSION', {
      description: 'User sessions with TTL',
      ttl: 10000, // 10 seconds in milliseconds
      history: 1
    });

    console.log('✓ Created bucket \'SESSION\' with 10s TTL\n');

    // Add session data
    await kv.put('session.user123', sc.encode('token-abc-xyz'));
    console.log('Put session.user123\n');

    // Get immediately
    let entry = await kv.get('session.user123');
    if (entry) {
      console.log(`Value: ${sc.decode(entry.value)}\n`);
    }

    console.log('Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Still exists
    entry = await kv.get('session.user123');
    if (entry) {
      console.log(`After 5s - Value: ${sc.decode(entry.value)}\n`);
    }

    console.log('Waiting another 6 seconds (11s total)...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Should be deleted by TTL
    try {
      entry = await kv.get('session.user123');
      if (entry && entry.value) {
        console.log(`Value: ${sc.decode(entry.value)}`);
      } else {
        console.log('Key expired (TTL)');
      }
    } catch (err) {
      console.log(`Key expired (TTL): ${err.message}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the TTL demo
main().catch(console.error);
