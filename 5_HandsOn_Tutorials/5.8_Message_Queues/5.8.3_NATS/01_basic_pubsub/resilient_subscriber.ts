import {
  connect,
  NatsConnection,
  ConnectionOptions,
  Msg,
  StringCodec,
  Subscription,
  NatsError
} from 'nats';

/**
 * Resilient subscriber with connection handling and reconnection
 * Demonstrates error handling, disconnection, and reconnection callbacks
 */
async function main(): Promise<void> {
  // Connection options with reconnection settings
  const options: ConnectionOptions = {
    servers: ['nats://localhost:4222'],
    name: 'resilient-subscriber',
    maxReconnectAttempts: 10,
    reconnectTimeWait: 2000, // 2 seconds between attempts

    // Connection event handlers
    reconnect: (nc: NatsConnection) => {
      console.log('Reconnected to NATS');
      console.log(`  Server: ${nc.getServer()}`);
    },

    disconnect: (url: string | undefined, err?: Error) => {
      console.log('Disconnected from NATS');
      if (err) {
        console.log(`  Reason: ${err.message}`);
      }
    },

    error: (err: NatsError) => {
      console.error(`Error: ${err.message}`);
    }
  };

  try {
    // Connect to NATS with resilience options
    const nc: NatsConnection = await connect(options);

    console.log(`Connected to NATS: ${nc.getServer()}`);
    console.log('\nListening for messages...');
    console.log('Try stopping and restarting NATS server to test reconnection\n');

    const sc = StringCodec();

    // Subscribe to test subject
    const sub: Subscription = nc.subscribe('test.>');

    // Process messages
    for await (const msg: Msg of sub) {
      const data: string = sc.decode(msg.data);
      console.log(`Received on ${msg.subject}: ${data}`);
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Fatal error:', err);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Run the subscriber
main().catch(console.error);
