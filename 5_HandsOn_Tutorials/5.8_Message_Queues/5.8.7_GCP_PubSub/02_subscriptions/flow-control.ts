// flow-control.ts
import { PubSub, Message, SubscriptionOptions } from '@google-cloud/pubsub';

/**
 * Subscribe with flow control settings
 *
 * @param projectId - Your GCP project ID
 * @param subscriptionId - The subscription to pull from
 */
async function subscribeWithFlowControl(
  projectId: string,
  subscriptionId: string
): Promise<void> {
  const pubsub = new PubSub({ projectId });

  // Configure flow control
  const subscriptionOptions: SubscriptionOptions = {
    flowControl: {
      maxMessages: 100,  // Max outstanding messages
      maxBytes: 10 * 1024 * 1024,  // Max outstanding bytes (10 MB)
    },
  };

  const subscription = pubsub.subscription(subscriptionId, subscriptionOptions);

  const messageHandler = (message: Message) => {
    console.log(`Processing: ${message.id}`);

    // Simulate processing
    setTimeout(() => {
      message.ack();
    }, 500);
  };

  subscription.on('message', messageHandler);

  console.log('Listening with flow control...');
  console.log(`  Max messages: ${subscriptionOptions.flowControl?.maxMessages}`);
  console.log(`  Max bytes: ${subscriptionOptions.flowControl?.maxBytes}`);
}

export { subscribeWithFlowControl };
