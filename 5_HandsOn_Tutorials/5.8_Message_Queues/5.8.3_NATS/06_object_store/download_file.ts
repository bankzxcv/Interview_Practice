import { connect, NatsConnection, ObjectStore } from 'nats';
import * as fs from 'fs';

/**
 * Download file from Object Store example
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const objStore: ObjectStore = await js.views.os('FILES');

    console.log('Object Store File Download\n');

    // Download file
    const objectName = 'documents/test.txt';
    const outputFile = 'downloaded_test.txt';

    console.log(`Downloading: ${objectName}`);

    // Get object
    const result = await objStore.get(objectName);
    if (!result) {
      console.log('Object not found');
      return;
    }

    // Write to file
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.data) {
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const fileData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      fileData.set(chunk, offset);
      offset += chunk.length;
    }

    fs.writeFileSync(outputFile, fileData);

    console.log(`✓ Downloaded to: ${outputFile}`);
    console.log(`  Size: ${fileData.length} bytes`);
    if (result.info.options?.meta) {
      console.log(`  Metadata: ${JSON.stringify(result.info.options.meta)}`);
    }

    // Read and display first few lines
    const content = fs.readFileSync(outputFile, 'utf-8');
    const lines = content.split('\n').slice(0, 5);
    console.log('\nFirst 5 lines:');
    for (const line of lines) {
      console.log(`  ${line}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the download example
main().catch(console.error);
