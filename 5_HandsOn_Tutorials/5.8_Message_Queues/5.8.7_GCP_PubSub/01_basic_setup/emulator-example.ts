// emulator-example.ts
import { PubSub } from '@google-cloud/pubsub';

// Set emulator host
process.env.PUBSUB_EMULATOR_HOST = 'localhost:8085';

/**
 * Test publishing and subscribing with emulator
 */
async function testEmulator(): Promise<void> {
  const projectId = 'test-project';
  const topicId = 'test-topic';
  const subscriptionId = 'test-subscription';

  // Create publisher and subscriber clients
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);
  const subscription = topic.subscription(subscriptionId);

  // Create topic
  try {
    const [createdTopic] = await topic.create();
    console.log(`✓ Created topic: ${createdTopic.name}`);
  } catch (error: any) {
    console.log(`Topic may already exist: ${error.message}`);
  }

  // Create subscription
  try {
    const [createdSubscription] = await topic.createSubscription(subscriptionId);
    console.log(`✓ Created subscription: ${createdSubscription.name}`);
  } catch (error: any) {
    console.log(`Subscription may already exist: ${error.message}`);
  }

  // Publish message
  const message = Buffer.from('Hello from emulator!', 'utf-8');
  const messageId = await topic.publishMessage({ data: message });
  console.log(`✓ Published message ID: ${messageId}`);

  // Pull message
  const [messages] = await subscription.pull({ maxMessages: 1 });

  if (messages.length > 0) {
    const receivedMessage = messages[0];
    console.log(`✓ Received: ${receivedMessage.data.toString('utf-8')}`);

    // Acknowledge message
    await subscription.ack(receivedMessage);
    console.log('✓ Message acknowledged');
  }
}

// Run if executed directly
if (require.main === module) {
  testEmulator().catch(console.error);
}

export { testEmulator };
