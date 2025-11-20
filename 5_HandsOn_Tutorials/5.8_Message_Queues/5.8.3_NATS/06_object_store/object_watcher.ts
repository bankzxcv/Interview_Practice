import { connect, NatsConnection, ObjectStore } from 'nats';

/**
 * Object watcher example
 * Watches for changes to objects in the store
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const objStore: ObjectStore = await js.views.os('FILES');

    console.log('Object Store Watcher\n');

    // Create watcher
    const watcher = await objStore.watch();

    // Process watch updates in background
    const watchPromise = (async () => {
      for await (const info of watcher) {
        if (!info) continue;

        if (info.deleted) {
          console.log(`[DELETED] ${info.name}`);
        } else {
          console.log(`[UPDATED] ${info.name}`);
          console.log(`  Size: ${info.size.toLocaleString()} bytes`);
          console.log(`  Modified: ${info.mtime}`);
          if (info.options?.meta) {
            console.log(`  Metadata: ${JSON.stringify(info.options.meta)}`);
          }
        }
        console.log();
      }
    })();

    // Simulate changes
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Making changes...\n');

    await objStore.put({ name: 'test1.txt' }, Buffer.from('File 1'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    await objStore.put({ name: 'test2.txt' }, Buffer.from('File 2'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    await objStore.delete('test1.txt');
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

// Run the object watcher example
main().catch(console.error);
