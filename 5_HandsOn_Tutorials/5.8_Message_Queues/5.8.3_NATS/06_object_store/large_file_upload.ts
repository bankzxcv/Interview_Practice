import { connect, NatsConnection, ObjectStore } from 'nats';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Large file upload example
 * Demonstrates uploading and verifying large files
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const js = nc.jetstream();
    const objStore: ObjectStore = await js.views.os('FILES');

    console.log('Large File Upload Test\n');

    // Create a 10 MB test file
    const testFile = 'large_file.bin';
    const fileSize = 10 * 1024 * 1024; // 10 MB

    console.log(`Creating ${(fileSize / 1024 / 1024).toFixed(1)} MB test file...`);

    // Generate file with random data
    const chunkSize = 1024 * 1024; // 1 MB chunks
    const writeStream = fs.createWriteStream(testFile);

    for (let i = 0; i < fileSize / chunkSize; i++) {
      const data = crypto.randomBytes(chunkSize);
      writeStream.write(data);
      if ((i + 1) % 2 === 0) {
        console.log(`  Written ${((i + 1) * chunkSize / 1024 / 1024).toFixed(1)} MB...`);
      }
    }

    writeStream.end();
    await new Promise(resolve => writeStream.on('finish', resolve));

    // Calculate checksum
    console.log('\nCalculating checksum...');
    const fileData = fs.readFileSync(testFile);
    const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');
    console.log(`SHA256: ${fileHash}\n`);

    // Upload file
    console.log('Uploading to Object Store...');

    const info = await objStore.put({
      name: 'files/large_file.bin',
      description: 'Large test file',
      options: {
        meta: {
          'sha256': fileHash,
          'content-type': 'application/octet-stream'
        }
      }
    }, fileData);

    console.log('✓ Upload complete!');
    console.log(`  Size: ${(info.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Chunks: ${info.chunks}`);

    // Download and verify
    console.log('\nDownloading and verifying...');
    const result = await objStore.get('files/large_file.bin');
    if (!result) {
      console.log('Error: Object not found');
      return;
    }

    const downloadChunks: Uint8Array[] = [];
    for await (const chunk of result.data) {
      downloadChunks.push(chunk);
    }

    const totalLength = downloadChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const downloadedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of downloadChunks) {
      downloadedData.set(chunk, offset);
      offset += chunk.length;
    }

    const downloadHash = crypto.createHash('sha256').update(downloadedData).digest('hex');
    console.log(`Downloaded SHA256: ${downloadHash}`);

    if (downloadHash === fileHash) {
      console.log('✓ Checksum verification PASSED');
    } else {
      console.log('✗ Checksum verification FAILED');
    }

    // Clean up
    fs.unlinkSync(testFile);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the large file upload example
main().catch(console.error);
