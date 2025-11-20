import {
  connect,
  NatsConnection,
  ConnectionOptions,
  Msg,
  StringCodec,
  Subscription
} from 'nats';

/**
 * Failover testing example
 * Demonstrates automatic failover when a cluster node fails
 */
async function main(): Promise<void> {
  // Connection options with reconnection
  const options: ConnectionOptions = {
    servers: [
      'nats://localhost:4222',
      'nats://localhost:4223',
      'nats://localhost:4224'
    ],
    maxReconnectAttempts: -1, // Reconnect forever
    reconnectTimeWait: 2000, // 2 seconds between attempts
    name: 'failover-test',

    reconnect: (nc: NatsConnection) => {
      console.log(`✓ Reconnected to: ${nc.getServer()}`);
    },

    disconnect: (url: string | undefined, err?: Error) => {
      console.log('⚠️  Disconnected from NATS');
      if (err) {
        console.log(`  Reason: ${err.message}`);
      }
    },

    error: (err: Error) => {
      console.error(`Error: ${err.message}`);
    }
  };

  const nc: NatsConnection = await connect(options);

  console.log(`Connected to: ${nc.getServer()}\n`);

  const sc = StringCodec();
  let messageCount = 0;

  try {
    // Subscribe to messages
    const sub: Subscription = nc.subscribe('test.failover');

    // Process messages in background
    const processMessages = (async () => {
      for await (const msg: Msg of sub) {
        messageCount++;
        const data: string = sc.decode(msg.data);
        console.log(`[${messageCount}] Received: ${data}`);
      }
    })();

    // Publish messages continuously
    let count = 0;
    const publishInterval = setInterval(async () => {
      try {
        nc.publish('test.failover', sc.encode(`Message ${count}`));
        count++;
      } catch (err) {
        console.error(`Publish error: ${err.message}`);
      }
    }, 2000);

    // Run for 2 minutes or until interrupted
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 120000); // 2 minutes

      process.on('SIGINT', () => {
        clearTimeout(timeout);
        clearInterval(publishInterval);
        resolve(undefined);
      });
    });

    clearInterval(publishInterval);
    sub.unsubscribe();
    await processMessages;

    console.log(`\n\nTotal messages sent: ${count}`);
    console.log(`Total messages received: ${messageCount}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the failover test
main().catch(console.error);
