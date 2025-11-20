import { connect, NatsConnection, JetStreamManager, StreamInfo } from 'nats';

/**
 * JetStream monitoring example
 * Lists all streams and their statistics
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const jsm: JetStreamManager = await nc.jetstreamManager();

    // List all streams
    const streams: StreamInfo[] = [];

    for await (const stream of await jsm.streams.list()) {
      streams.push(stream);
    }

    console.log(`Total streams: ${streams.length}\n`);

    for (const stream of streams) {
      console.log(`Stream: ${stream.config.name}`);
      console.log(`  Subjects: ${stream.config.subjects.join(', ')}`);
      console.log(`  Storage: ${stream.config.storage}`);
      console.log(`  Retention: ${stream.config.retention}`);
      console.log(`  Messages: ${stream.state.messages.toLocaleString()}`);
      console.log(`  Bytes: ${stream.state.bytes.toLocaleString()}`);
      console.log(`  First Seq: ${stream.state.first_seq}`);
      console.log(`  Last Seq: ${stream.state.last_seq}`);
      console.log(`  Consumers: ${stream.state.consumer_count}`);
      console.log();
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the JetStream monitor
main().catch(console.error);
