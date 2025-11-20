// bigquery-subscription.ts
import { PubSub } from '@google-cloud/pubsub';

/**
 * Create a BigQuery subscription
 *
 * @param projectId - Your GCP project ID
 * @param topicId - Source Pub/Sub topic
 * @param subscriptionId - Subscription ID
 * @param datasetId - BigQuery dataset
 * @param tableId - BigQuery table
 */
async function createBigQuerySubscription(
  projectId: string,
  topicId: string,
  subscriptionId: string,
  datasetId: string,
  tableId: string
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  try {
    const [subscription] = await topic.createSubscription(subscriptionId, {
      bigQueryConfig: {
        table: `${projectId}.${datasetId}.${tableId}`,
        useTopicSchema: true,
        writeMetadata: true,  // Include publish_time, message_id, attributes
      },
    });

    console.log(`✓ BigQuery subscription created: ${subscription.name}`);
    console.log(`  Writing to: ${projectId}.${datasetId}.${tableId}`);
  } catch (error) {
    console.error('✗ Error creating subscription:', error);
    throw error;
  }
}

/**
 * Update BigQuery subscription configuration
 */
async function updateBigQuerySubscription(
  projectId: string,
  subscriptionId: string,
  useTableSchema: boolean = true
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const subscription = pubsub.subscription(subscriptionId);

  const [metadata] = await subscription.setMetadata({
    bigQueryConfig: {
      useTableSchema,
    },
  });

  console.log('✓ Subscription updated');
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'orders-topic';
  const SUBSCRIPTION_ID = 'orders-to-bigquery';
  const DATASET_ID = 'analytics';
  const TABLE_ID = 'orders';

  createBigQuerySubscription(
    PROJECT_ID,
    TOPIC_ID,
    SUBSCRIPTION_ID,
    DATASET_ID,
    TABLE_ID
  ).catch(console.error);
}

export { createBigQuerySubscription, updateBigQuerySubscription };
