// publish-to-bigquery.ts
import { PubSub } from '@google-cloud/pubsub';
import { v4 as uuidv4 } from 'uuid';

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface OrderMetadata {
  source: string;
  version: string;
  ip_address: string;
}

interface OrderMessage {
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  metadata: OrderMetadata;
}

/**
 * Publish order message compatible with BigQuery schema
 */
async function publishOrderToBigQuery(
  projectId: string,
  topicId: string
): Promise<string> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  // Create order message matching BigQuery schema
  const order: OrderMessage = {
    order_id: `ORD-${uuidv4().substring(0, 8)}`,
    customer_id: `CUST-${uuidv4().substring(0, 8)}`,
    amount: 299.99,
    currency: 'USD',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    items: [
      {
        product_id: 'PROD-001',
        quantity: 2,
        price: 99.99,
      },
      {
        product_id: 'PROD-002',
        quantity: 1,
        price: 99.99,
      },
    ],
    metadata: {
      source: 'web_app',
      version: '1.0',
      ip_address: '192.168.1.1',
    },
  };

  // Publish
  const dataBuffer = Buffer.from(JSON.stringify(order), 'utf-8');
  const messageId = await topic.publishMessage({ data: dataBuffer });

  console.log(`✓ Published order: ${order.order_id}`);
  console.log(`  Message ID: ${messageId}`);
  console.log('  Will appear in BigQuery shortly');

  return messageId;
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'orders-topic';

  (async () => {
    // Publish multiple orders
    for (let i = 0; i < 10; i++) {
      await publishOrderToBigQuery(PROJECT_ID, TOPIC_ID);
    }
  })().catch(console.error);
}

export { publishOrderToBigQuery };
