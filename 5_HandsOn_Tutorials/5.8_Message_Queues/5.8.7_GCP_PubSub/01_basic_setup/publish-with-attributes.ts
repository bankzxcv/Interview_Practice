// publish-with-attributes.ts
import { PubSub } from '@google-cloud/pubsub';
import { v4 as uuidv4 } from 'uuid';

interface OrderData {
  user_id: string;
  action: string;
  amount: number;
  currency: string;
}

interface MessageAttributes {
  [key: string]: string;
}

/**
 * Publish messages with custom attributes
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 */
async function publishWithAttributes(
  projectId: string,
  topicId: string
): Promise<string> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  // Message payload
  const messageData: OrderData = {
    user_id: 'user_123',
    action: 'purchase',
    amount: 99.99,
    currency: 'USD',
  };
  const dataBuffer = Buffer.from(JSON.stringify(messageData), 'utf-8');

  // Message attributes (metadata)
  const attributes: MessageAttributes = {
    origin: 'web_app',
    version: '1.0',
    timestamp: new Date().toISOString(),
    correlation_id: uuidv4(),
    content_type: 'application/json',
    priority: 'high',
  };

  // Publish with attributes
  const messageId = await topic.publishMessage({
    data: dataBuffer,
    attributes,
  });

  console.log(`✓ Published message ID: ${messageId}`);
  console.log(`  Data: ${JSON.stringify(messageData)}`);
  console.log(`  Attributes: ${JSON.stringify(attributes)}`);

  return messageId;
}

/**
 * Publish message with routing attributes for filtering
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 * @param eventType - Type of event (for subscription filtering)
 * @param data - Message payload
 */
async function publishWithRoutingKey(
  projectId: string,
  topicId: string,
  eventType: string,
  data: Record<string, any>
): Promise<string> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  const dataBuffer = Buffer.from(JSON.stringify(data), 'utf-8');

  // Routing attributes
  const attributes: MessageAttributes = {
    event_type: eventType,
    source: 'order_service',
    timestamp: new Date().toISOString(),
  };

  const messageId = await topic.publishMessage({
    data: dataBuffer,
    attributes,
  });

  console.log(`✓ Published ${eventType} event (ID: ${messageId})`);
  return messageId;
}

/**
 * Publish different types of events with routing attributes
 */
async function publishVariousEvents(
  projectId: string,
  topicId: string
): Promise<void> {
  // Order created event
  await publishWithRoutingKey(
    projectId,
    topicId,
    'order.created',
    { order_id: 'ORD-001', amount: 99.99 }
  );

  // Order shipped event
  await publishWithRoutingKey(
    projectId,
    topicId,
    'order.shipped',
    { order_id: 'ORD-001', tracking: 'TRACK-123' }
  );

  // Order cancelled event
  await publishWithRoutingKey(
    projectId,
    topicId,
    'order.cancelled',
    { order_id: 'ORD-002', reason: 'customer_request' }
  );
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'events-topic';

  (async () => {
    // Publish with attributes
    await publishWithAttributes(PROJECT_ID, TOPIC_ID);

    // Publish various events
    await publishVariousEvents(PROJECT_ID, TOPIC_ID);
  })().catch(console.error);
}

export { publishWithAttributes, publishWithRoutingKey, publishVariousEvents };
