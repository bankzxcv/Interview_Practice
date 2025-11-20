import { connect, NatsConnection, StringCodec } from 'nats';

/**
 * Event message interface
 */
interface EventMessage {
  event: string;
  data: string;
}

/**
 * Wildcard publisher example
 * Publishes to various subjects to test wildcard subscriptions
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Connected to NATS\n');

  const sc = StringCodec();

  try {
    // Subjects to publish to
    const subjects: string[] = [
      'orders.created',              // Matches orders.*
      'orders.updated',              // Matches orders.*
      'orders.shipped.confirmed',    // Matches orders.shipped.>
      'orders.shipped.tracking',     // Matches orders.shipped.>
      'orders.cancelled',            // Matches orders.*
    ];

    for (const subject of subjects) {
      const message: EventMessage = {
        event: subject,
        data: 'test'
      };

      nc.publish(subject, sc.encode(JSON.stringify(message)));
      console.log(`Published to: ${subject}`);

      // Wait 500ms between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Ensure all messages are sent
    await nc.flush();

    console.log('\nAll messages published!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
    console.log('Connection closed');
  }
}

// Run the publisher
main().catch(console.error);
