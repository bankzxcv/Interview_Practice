import { connect, NatsConnection, ObjectStore } from 'nats';

/**
 * Create Object Store bucket example
 * Demonstrates creating an Object Store for large files
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();

    console.log('Creating Object Store bucket...\n');

    // Create object store
    const objStore: ObjectStore = await js.views.os('FILES', {
      description: 'File storage bucket',
      max_bytes: 10 * 1024 * 1024 * 1024, // 10 GB max
      storage: 'file', // File storage (persistent)
    });

    console.log(`✓ Created Object Store: FILES\n`);

    // Get bucket info
    const info = await objStore.status();
    console.log('Bucket Info:');
    console.log(`  Bucket: ${info.bucket}`);
    console.log(`  Description: ${info.description}`);
    console.log(`  Size: ${info.size} bytes`);
    console.log(`  Storage: ${info.storage}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the object store creator
main().catch(console.error);
