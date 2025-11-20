// exactly-once.ts
import { PubSub, Subscription } from '@google-cloud/pubsub';

/**
 * Create a subscription with exactly-once delivery
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to subscribe to
 * @param subscriptionId - The subscription ID
 */
async function createSubscriptionWithExactlyOnce(
  projectId: string,
  topicId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  try {
    const [subscription] = await topic.createSubscription(subscriptionId, {
      enableExactlyOnceDelivery: true,
      ackDeadlineSeconds: 60,
    });

    console.log(`✓ Subscription created: ${subscription.name}`);
    console.log(`  Exactly-once delivery: enabled`);
    return subscription;
  } catch (error) {
    console.error('✗ Error creating subscription:', error);
    throw error;
  }
}

/**
 * Consume messages with exactly-once delivery
 *
 * @param projectId - Your GCP project ID
 * @param subscriptionId - Subscription with exactly-once enabled
 */
async function consumeWithExactlyOnce(
  projectId: string,
  subscriptionId: string
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const subscription = pubsub.subscription(subscriptionId);

  const processedMessages = new Set<string>();

  subscription.on('message', (message) => {
    const messageId = message.id;

    // Check if already processed (shouldn't happen with exactly-once)
    if (processedMessages.has(messageId)) {
      console.log(`⚠ Duplicate detected: ${messageId}`);
      message.ack();
      return;
    }

    try {
      // Process message
      const data = message.data.toString('utf-8');
      console.log(`Processing: ${messageId}`);
      console.log(`  Data: ${data}`);

      // Your business logic (doesn't need to be idempotent with exactly-once)
      processExactlyOnce(data);

      // Acknowledge
      message.ack();
      processedMessages.add(messageId);
      console.log(`  ✓ Processed and acknowledged`);
    } catch (error: any) {
      console.error(`  ✗ Acknowledgment error:`, error);
      // Message will be redelivered
    }
  });

  console.log('Listening with exactly-once delivery...');
}

function processExactlyOnce(data: string): void {
  // Example: Credit account (critical operation)
  console.log(`  Crediting account based on: ${data}`);
  // Process...
}

export { createSubscriptionWithExactlyOnce, consumeWithExactlyOnce };
