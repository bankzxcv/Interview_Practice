// sync-pull.ts
import { PubSub, Message } from '@google-cloud/pubsub';

/**
 * Pull messages synchronously (blocking)
 *
 * @param projectId - Your GCP project ID
 * @param subscriptionId - The subscription to pull from
 * @param maxMessages - Maximum number of messages to pull
 */
async function synchronousPull(
  projectId: string,
  subscriptionId: string,
  maxMessages: number = 10
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const subscription = pubsub.subscription(subscriptionId);

  // Pull messages
  const [messages] = await subscription.pull({ maxMessages });

  console.log(`Received ${messages.length} messages`);

  const ackIds: string[] = [];

  messages.forEach((message) => {
    console.log(`\nMessage ID: ${message.id}`);
    console.log(`Data: ${message.data.toString('utf-8')}`);
    console.log(`Attributes: ${JSON.stringify(message.attributes)}`);
    console.log(`Publish time: ${message.publishTime.toDate()}`);

    ackIds.push(message.ackId);
  });

  // Acknowledge all messages
  if (ackIds.length > 0) {
    await subscription.ack(ackIds);
    console.log(`\n✓ Acknowledged ${ackIds.length} messages`);
  }
}

/**
 * Pull messages with a timeout
 *
 * @param projectId - Your GCP project ID
 * @param subscriptionId - The subscription to pull from
 * @param timeoutSeconds - Timeout in seconds
 */
async function pullWithTimeout(
  projectId: string,
  subscriptionId: string,
  timeoutSeconds: number = 10
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const subscription = pubsub.subscription(subscriptionId);

  try {
    const [messages] = await Promise.race([
      subscription.pull({ maxMessages: 10 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutSeconds * 1000)
      ),
    ]);

    console.log(`Received ${messages.length} messages`);
    // Process messages...
  } catch (error: any) {
    if (error.message === 'Timeout') {
      console.log('No messages received within timeout');
    } else {
      console.error('Error:', error);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const SUBSCRIPTION_ID = 'basic-sub';

  synchronousPull(PROJECT_ID, SUBSCRIPTION_ID).catch(console.error);
}

export { synchronousPull, pullWithTimeout };
