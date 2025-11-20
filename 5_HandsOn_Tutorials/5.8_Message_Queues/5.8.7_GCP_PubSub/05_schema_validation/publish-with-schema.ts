// publish-with-schema.ts
import { PubSub, Encoding } from '@google-cloud/pubsub';

interface OrderData {
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  timestamp: number;
  status: string;
}

/**
 * Create a topic with Avro schema validation
 */
async function createTopicWithAvroSchema(
  projectId: string,
  topicId: string,
  schemaId: string,
  encoding: Encoding = Encoding.Json
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const schemaName = `projects/${projectId}/schemas/${schemaId}`;

  try {
    const [topic] = await pubsub.createTopic(topicId, {
      schemaSettings: {
        schema: schemaName,
        encoding,
      },
    });

    console.log(`✓ Topic created with schema: ${topic.name}`);
    console.log(`  Schema: ${schemaName}`);
    console.log(`  Encoding: ${encoding}`);
  } catch (error) {
    console.error('✗ Error creating topic:', error);
    throw error;
  }
}

/**
 * Publish message to topic with Avro schema (JSON encoding)
 */
async function publishAvroJsonMessage(
  projectId: string,
  topicId: string
): Promise<string> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  // Create message matching Avro schema
  const orderData: OrderData = {
    order_id: 'ORD-12345',
    customer_id: 'CUST-789',
    amount: 299.99,
    currency: 'USD',
    timestamp: Date.now(),
    status: 'PENDING',
  };

  // Encode as JSON string
  const dataBuffer = Buffer.from(JSON.stringify(orderData), 'utf-8');

  try {
    const messageId = await topic.publishMessage({ data: dataBuffer });
    console.log(`✓ Published valid Avro message: ${messageId}`);
    console.log(`  Order: ${orderData.order_id}`);
    return messageId;
  } catch (error) {
    console.error('✗ Publish failed (schema validation):', error);
    throw error;
  }
}

/**
 * Attempt to publish invalid message (will be rejected)
 */
async function publishInvalidAvroMessage(
  projectId: string,
  topicId: string
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  // Invalid: missing required field 'order_id'
  const invalidData = {
    customer_id: 'CUST-789',
    amount: 'not-a-number',  // Invalid: should be double
    currency: 'USD',
  };

  const dataBuffer = Buffer.from(JSON.stringify(invalidData), 'utf-8');

  try {
    const messageId = await topic.publishMessage({ data: dataBuffer });
    console.log(`✓ Published: ${messageId}`);  // Won't reach here
  } catch (error: any) {
    console.error('✗ Publish rejected by schema validation:');
    console.error(`  Error: ${error.message}`);
  }
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'orders-topic-avro';

  (async () => {
    // Publish valid message
    await publishAvroJsonMessage(PROJECT_ID, TOPIC_ID);

    // Try to publish invalid message
    await publishInvalidAvroMessage(PROJECT_ID, TOPIC_ID);
  })().catch(console.error);
}

export { createTopicWithAvroSchema, publishAvroJsonMessage, publishInvalidAvroMessage };
