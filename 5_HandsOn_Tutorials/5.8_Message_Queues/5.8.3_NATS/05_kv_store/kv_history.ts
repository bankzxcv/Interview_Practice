import { connect, NatsConnection, KV, StringCodec, KvEntry } from 'nats';

/**
 * KV history example
 * Demonstrates version history and revisions
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const sc = StringCodec();
    const kv: KV = await js.views.kv('CONFIG');

    console.log('Creating version history for \'app.timeout\'...\n');

    // Create multiple revisions
    const values = ['10', '20', '30', '40', '50'];

    for (const value of values) {
      const rev = await kv.put('app.timeout', sc.encode(value));
      console.log(`Revision ${rev}: app.timeout = ${value}`);
    }

    console.log('\n=== HISTORY ===\n');

    // Get history of key
    const history: KvEntry[] = [];
    const iter = await kv.history({ key: 'app.timeout' });

    for await (const entry of iter) {
      history.push(entry);
      console.log(`Revision ${entry.revision}:`);
      console.log(`  Value: ${entry.value ? sc.decode(entry.value) : 'DELETED'}`);
      console.log(`  Created: ${entry.created}`);
      console.log(`  Operation: ${entry.operation}`);
    }

    console.log(`\nTotal revisions: ${history.length}`);

    // Get current value
    const current = await kv.get('app.timeout');
    if (current) {
      console.log(`\nCurrent value: ${sc.decode(current.value)}`);
      console.log(`Current revision: ${current.revision}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the history demo
main().catch(console.error);
