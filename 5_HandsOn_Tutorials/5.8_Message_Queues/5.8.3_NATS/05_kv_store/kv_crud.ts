import { connect, NatsConnection, KV, StringCodec } from 'nats';

/**
 * KV CRUD operations example
 * Demonstrates Create, Read, Update, Delete operations
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const sc = StringCodec();

    // Get or create KV bucket
    let kv: KV;
    try {
      kv = await js.views.kv('CONFIG');
    } catch {
      kv = await js.views.kv('CONFIG', {});
    }

    console.log('=== CREATE ===\n');

    // PUT - Create/Update key
    const rev1 = await kv.put('app.timeout', sc.encode('30'));
    console.log(`Put 'app.timeout' = '30', revision: ${rev1}`);

    const rev2 = await kv.put('app.max_connections', sc.encode('100'));
    console.log(`Put 'app.max_connections' = '100', revision: ${rev2}`);

    const rev3 = await kv.put('feature.new_ui', sc.encode('enabled'));
    console.log(`Put 'feature.new_ui' = 'enabled', revision: ${rev3}`);

    console.log('\n=== READ ===\n');

    // GET - Retrieve key
    const entry = await kv.get('app.timeout');
    if (entry) {
      console.log('Get \'app.timeout\':');
      console.log(`  Value: ${sc.decode(entry.value)}`);
      console.log(`  Revision: ${entry.revision}`);
      console.log(`  Created: ${entry.created}`);
    }

    console.log('\n=== UPDATE ===\n');

    // UPDATE - Put updates existing key
    const rev4 = await kv.put('app.timeout', sc.encode('60'));
    console.log(`Updated 'app.timeout' = '60', revision: ${rev4}`);

    // Verify update
    const updatedEntry = await kv.get('app.timeout');
    if (updatedEntry) {
      console.log(`New value: ${sc.decode(updatedEntry.value)}, revision: ${updatedEntry.revision}`);
    }

    console.log('\n=== DELETE ===\n');

    // DELETE - Remove key
    await kv.delete('feature.new_ui');
    console.log('Deleted \'feature.new_ui\'');

    console.log('\n=== LIST KEYS ===\n');

    // List all keys
    const keys = await kv.keys();
    const keyList: string[] = [];
    for await (const key of keys) {
      keyList.push(key);
    }
    console.log(`Keys in bucket: ${keyList.join(', ')}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the CRUD demo
main().catch(console.error);
