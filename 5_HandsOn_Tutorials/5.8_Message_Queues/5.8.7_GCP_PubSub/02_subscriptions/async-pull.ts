// async-pull.ts
import { PubSub, Message, Subscription } from '@google-cloud/pubsub';

/**
 * Pull messages asynchronously with a callback
 *
 * @param projectId - Your GCP project ID
 * @param subscriptionId - The subscription to pull from
 * @param timeout - How long to listen (undefined = indefinitely)
 */
async function asyncPullWithCallback(
  projectId: string,
  subscriptionId: string,
  timeout?: number
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const subscription = pubsub.subscription(subscriptionId);

  /**
   * Process received message
   */
  const messageHandler = (message: Message) => {
    console.log(`\n✓ Received message: ${message.id}`);
    console.log(`  Data: ${message.data.toString('utf-8')}`);
    console.log(`  Attributes: ${JSON.stringify(message.attributes)}`);
    console.log(`  Publish time: ${message.publishTime.toDate()}`);

    // Simulate processing
    try {
      processMessage(message);

      // Acknowledge successful processing
      message.ack();
      console.log(`  ✓ Acknowledged: ${message.id}`);
    } catch (error) {
      console.error(`  ✗ Error processing message:`, error);
      // Don't acknowledge - message will be redelivered
      message.nack();
    }
  };

  /**
   * Handle errors
   */
  const errorHandler = (error: Error) => {
    console.error('Error receiving messages:', error);
  };

  // Listen for messages
  subscription.on('message', messageHandler);
  subscription.on('error', errorHandler);

  console.log(`Listening for messages on ${subscription.name}...`);
  console.log('Press Ctrl+C to stop\n');

  // If timeout is provided, stop after that duration
  if (timeout) {
    setTimeout(() => {
      subscription.removeListener('message', messageHandler);
      subscription.removeListener('error', errorHandler);
      console.log('\nTimeout reached, stopping subscriber');
    }, timeout * 1000);
  }
}

/**
 * Simulate message processing
 */
function processMessage(message: Message): void {
  // Your business logic here
  // Simulate work
  const data = message.data.toString('utf-8');
  // Process data...
}

/**
 * Async pull with comprehensive error handling
 *
 * @param projectId - Your GCP project ID
 * @param subscriptionId - The subscription to pull from
 */
async function asyncPullWithErrorHandling(
  projectId: string,
  subscriptionId: string
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const subscription = pubsub.subscription(subscriptionId);

  const messageHandler = (message: Message) => {
    try {
      console.log(`Processing: ${message.id}`);

      // Attempt to process
      const data = message.data.toString('utf-8');

      // Simulate processing that might fail
      if (data.toLowerCase().includes('error')) {
        throw new Error('Simulated processing error');
      }

      // Success
      message.ack();
      console.log(`  ✓ Success: ${message.id}`);
    } catch (error: any) {
      if (error.message.includes('processing error')) {
        console.error(`  ✗ Business logic error:`, error);
        // Nack - message will be redelivered
        message.nack();
      } else {
        console.error(`  ✗ Unexpected error:`, error);
        // Don't ack or nack - let deadline expire
      }
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => {
    console.error('Subscription error:', error);
  });

  console.log(`Listening with error handling on ${subscription.name}...`);
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const SUBSCRIPTION_ID = 'basic-sub';

  // Async pull with callback
  asyncPullWithCallback(PROJECT_ID, SUBSCRIPTION_ID, 60).catch(console.error);

  // Async pull with error handling
  // asyncPullWithErrorHandling(PROJECT_ID, SUBSCRIPTION_ID).catch(console.error);
}

export { asyncPullWithCallback, asyncPullWithErrorHandling };
