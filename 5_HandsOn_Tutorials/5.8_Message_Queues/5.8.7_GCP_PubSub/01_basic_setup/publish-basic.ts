// publish-basic.ts
import { PubSub } from '@google-cloud/pubsub';

/**
 * Publish a single message to a Pub/Sub topic
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 * @param message - The message to publish
 * @returns The message ID
 */
async function publishMessage(
  projectId: string,
  topicId: string,
  message: string
): Promise<string> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  // Data must be a Buffer
  const dataBuffer = Buffer.from(message, 'utf-8');

  // Publish the message
  const messageId = await topic.publishMessage({ data: dataBuffer });

  console.log(`✓ Published message ID: ${messageId}`);
  return messageId;
}

/**
 * Publish multiple messages with callback handlers
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 * @param messages - Array of messages to publish
 */
async function publishMessagesWithCallback(
  projectId: string,
  topicId: string,
  messages: string[]
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  // Publish messages
  const publishPromises = messages.map(async (message) => {
    try {
      const dataBuffer = Buffer.from(message, 'utf-8');
      const messageId = await topic.publishMessage({ data: dataBuffer });
      console.log(`✓ Message published: ${message} (ID: ${messageId})`);
      return messageId;
    } catch (error) {
      console.error(`✗ Failed to publish ${message}:`, error);
      throw error;
    }
  });

  // Wait for all messages to be published
  await Promise.all(publishPromises);
}

/**
 * Publish messages synchronously (blocking)
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 * @param count - Number of messages to publish
 */
async function publishMessagesSync(
  projectId: string,
  topicId: string,
  count: number
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  const startTime = Date.now();

  for (let i = 0; i < count; i++) {
    const message = `Message ${i}`;
    const dataBuffer = Buffer.from(message, 'utf-8');

    // Blocking call
    await topic.publishMessage({ data: dataBuffer });

    if (i % 100 === 0) {
      console.log(`Published ${i} messages...`);
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`\n✓ Published ${count} messages in ${elapsed.toFixed(2)} seconds`);
  console.log(`Average: ${(count / elapsed).toFixed(2)} messages/second`);
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'my-first-topic';

  (async () => {
    // Publish a single message
    await publishMessage(PROJECT_ID, TOPIC_ID, 'Hello, Pub/Sub!');

    // Publish multiple messages with callbacks
    const messages = Array.from({ length: 10 }, (_, i) => `Message ${i}`);
    await publishMessagesWithCallback(PROJECT_ID, TOPIC_ID, messages);

    // Publish many messages synchronously
    await publishMessagesSync(PROJECT_ID, TOPIC_ID, 1000);
  })().catch(console.error);
}

export { publishMessage, publishMessagesWithCallback, publishMessagesSync };
