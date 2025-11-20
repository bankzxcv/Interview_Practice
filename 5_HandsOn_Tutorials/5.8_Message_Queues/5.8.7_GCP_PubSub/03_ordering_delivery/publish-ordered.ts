// publish-ordered.ts
import { PubSub, PublishOptions } from '@google-cloud/pubsub';

/**
 * Publish messages with an ordering key
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 * @param orderingKey - The ordering key (e.g., user ID, session ID)
 * @param messages - Array of messages to publish
 */
async function publishMessagesWithOrderingKey(
  projectId: string,
  topicId: string,
  orderingKey: string,
  messages: string[]
): Promise<void> {
  // Enable message ordering in publisher
  const publishOptions: PublishOptions = {
    messageOrdering: true,
  };

  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId, publishOptions);

  console.log(`Publishing ${messages.length} messages with ordering key: ${orderingKey}`);

  const publishPromises: Promise<string>[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const dataBuffer = Buffer.from(message, 'utf-8');

    // Publish with ordering key
    const promise = topic.publishMessage({
      data: dataBuffer,
      orderingKey,
    });

    publishPromises.push(promise);
    console.log(`  Queued message ${i + 1}: ${message}`);
  }

  // Wait for all messages to be published
  const messageIds = await Promise.all(publishPromises);

  messageIds.forEach((id) => {
    console.log(`  ✓ Published: ${id}`);
  });

  console.log('✓ All messages published in order');
}

/**
 * Publish user events with ordering by user ID
 */
async function publishUserEventsOrdered(
  projectId: string,
  topicId: string
): Promise<void> {
  const publishOptions: PublishOptions = {
    messageOrdering: true,
  };

  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId, publishOptions);

  // Events for user 123 (must be in order)
  const user123Events = [
    { event: 'login', user_id: '123', timestamp: Date.now() },
    { event: 'view_product', user_id: '123', product: 'A' },
    { event: 'add_to_cart', user_id: '123', product: 'A' },
    { event: 'checkout', user_id: '123', amount: 99.99 },
    { event: 'logout', user_id: '123' },
  ];

  // Publish user 123 events
  console.log('Publishing events for user 123...');
  for (const event of user123Events) {
    const dataBuffer = Buffer.from(JSON.stringify(event), 'utf-8');
    const messageId = await topic.publishMessage({
      data: dataBuffer,
      orderingKey: 'user:123',
    });
    console.log(`  ✓ ${event.event}: ${messageId}`);
  }
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'ordered-topic';

  (async () => {
    // Publish messages with ordering
    const messages = ['Message 1', 'Message 2', 'Message 3', 'Message 4', 'Message 5'];
    await publishMessagesWithOrderingKey(
      PROJECT_ID,
      TOPIC_ID,
      'session:abc123',
      messages
    );

    // Publish user events
    await publishUserEventsOrdered(PROJECT_ID, TOPIC_ID);
  })().catch(console.error);
}

export { publishMessagesWithOrderingKey, publishUserEventsOrdered };
