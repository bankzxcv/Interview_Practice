import { connect, NatsConnection, ObjectStore } from 'nats';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Upload file to Object Store example
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();

    // Get or create object store
    let objStore: ObjectStore;
    try {
      objStore = await js.views.os('FILES');
    } catch {
      objStore = await js.views.os('FILES', {});
    }

    console.log('Object Store File Upload\n');

    // Create a test file
    const testFile = 'test_document.txt';
    const content = 'Hello from NATS Object Store!\n'.repeat(1000);
    fs.writeFileSync(testFile, content);

    const fileSize = fs.statSync(testFile).size;
    console.log(`Uploading: ${testFile} (${fileSize} bytes)\n`);

    // Upload file
    const fileData = fs.readFileSync(testFile);
    const info = await objStore.put({
      name: 'documents/test.txt',
      description: 'Test document',
      options: {
        meta: {
          'content-type': 'text/plain',
          'uploaded-by': 'tutorial'
        }
      }
    }, fileData);

    console.log('✓ Uploaded successfully!');
    console.log(`  Name: ${info.name}`);
    console.log(`  Size: ${info.size} bytes`);
    console.log(`  Chunks: ${info.chunks}`);
    console.log(`  Modified: ${info.mtime}`);

    // Clean up
    fs.unlinkSync(testFile);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the upload example
main().catch(console.error);
