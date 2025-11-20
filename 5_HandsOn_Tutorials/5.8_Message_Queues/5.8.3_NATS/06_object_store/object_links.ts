import { connect, NatsConnection, ObjectStore } from 'nats';

/**
 * Object links example
 * Demonstrates creating references/links to objects
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const objStore: ObjectStore = await js.views.os('FILES');

    console.log('Object Store Links\n');

    // Create original object
    const originalName = 'documents/original.txt';
    const content = Buffer.from('This is the original document content.');

    await objStore.put({ name: originalName }, content);
    console.log(`✓ Created: ${originalName}`);

    // Get object info
    const info = await objStore.info(originalName);

    if (info) {
      // Create link (reference)
      const linkName = 'documents/shortcut.txt';
      await objStore.link(linkName, info);
      console.log(`✓ Created link: ${linkName} -> ${originalName}`);

      // Access via link
      const result = await objStore.get(linkName);
      if (result) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of result.data) {
          chunks.push(chunk);
        }

        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const data = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          data.set(chunk, offset);
          offset += chunk.length;
        }

        console.log('\nContent via link:');
        console.log(`  ${new TextDecoder().decode(data)}`);
      }

      // List all objects
      console.log('\n=== Objects ===\n');
      for await (const objInfo of await objStore.list()) {
        const objType = objInfo.options?.link ? 'LINK' : 'FILE';
        console.log(`${objType}: ${objInfo.name} (${objInfo.size} bytes)`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the object links example
main().catch(console.error);
