import { connect, NatsConnection, KV, StringCodec, KvWatchOptions } from 'nats';

/**
 * KV watcher example
 * Watches for changes to all keys in real-time
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const sc = StringCodec();
    const kv: KV = await js.views.kv('CONFIG');

    console.log('Starting watcher for all keys...\n');

    // Watch all keys
    const opts: KvWatchOptions = {};
    const watcher = await kv.watch(opts);

    // Process watch updates in background
    const watchPromise = (async () => {
      for await (const entry of watcher) {
        if (!entry) continue;

        console.log(`[WATCH] Key: ${entry.key}`);
        console.log(`  Value: ${entry.value ? sc.decode(entry.value) : 'DELETED'}`);
        console.log(`  Revision: ${entry.revision}`);
        console.log(`  Operation: ${entry.operation}`);
        console.log();
      }
    })();

    // Simulate updates
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Making changes to KV store...\n');

    await kv.put('app.timeout', sc.encode('100'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    await kv.put('app.max_connections', sc.encode('500'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    await kv.put('feature.dark_mode', sc.encode('enabled'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    await kv.delete('feature.dark_mode');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stop watcher
    watcher.stop();
    await watchPromise;

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the watcher demo
main().catch(console.error);
