import { connect, NatsConnection, ObjectStore, ObjectInfo } from 'nats';

/**
 * Object info and listing example
 * Demonstrates listing and inspecting objects
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const objStore: ObjectStore = await js.views.os('FILES');

    console.log('Object Store - List and Info\n');

    // List all objects
    console.log('=== All Objects ===\n');

    const objects: ObjectInfo[] = [];
    for await (const info of await objStore.list()) {
      objects.push(info);
      console.log(`Name: ${info.name}`);
      console.log(`  Size: ${info.size.toLocaleString()} bytes`);
      console.log(`  Modified: ${info.mtime}`);
      console.log(`  Digest: ${info.digest}`);
      if (info.options?.meta) {
        console.log(`  Metadata: ${JSON.stringify(info.options.meta)}`);
      }
      console.log();
    }

    console.log(`Total objects: ${objects.length}\n`);

    // Get specific object info (without downloading)
    if (objects.length > 0) {
      const objectName = objects[0].name;
      console.log(`=== Detailed Info: ${objectName} ===\n`);

      const info = await objStore.info(objectName);
      if (info) {
        console.log(`  Name: ${info.name}`);
        console.log(`  Size: ${info.size.toLocaleString()} bytes`);
        console.log(`  Chunks: ${info.chunks}`);
        console.log(`  Digest: ${info.digest}`);
        console.log(`  Modified: ${info.mtime}`);
        console.log(`  Deleted: ${info.deleted}`);
        if (info.options?.meta) {
          for (const [key, value] of Object.entries(info.options.meta)) {
            console.log(`  ${key}: ${value}`);
          }
        }
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the object info example
main().catch(console.error);
