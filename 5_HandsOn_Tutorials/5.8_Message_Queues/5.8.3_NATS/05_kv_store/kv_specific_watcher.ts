import { connect, NatsConnection, KV, StringCodec } from 'nats';

/**
 * Specific key watcher example
 * Watches for changes to a specific key
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const sc = StringCodec();
    const kv: KV = await js.views.kv('CONFIG');

    console.log('Watching for changes to \'app.timeout\'...\n');

    // Watch specific key
    const watcher = await kv.watch({ key: 'app.timeout' });

    let count = 0;

    for await (const entry of watcher) {
      if (!entry) continue;

      count++;
      const value = entry.value ? sc.decode(entry.value) : 'DELETED';
      console.log(`[${count}] app.timeout changed to: ${value} (rev ${entry.revision})`);

      if (count >= 5) { // Stop after 5 updates
        break;
      }
    }

    watcher.stop();

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the specific watcher demo
main().catch(console.error);
