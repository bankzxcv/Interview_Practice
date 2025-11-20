// global-architecture.ts
import { PubSub } from '@google-cloud/pubsub';

/**
 * Create global Pub/Sub architecture
 *
 * Pattern: Single Global Topic with Regional Subscriptions
 *   Publisher (US) ─┐
 *   Publisher (EU) ─┤→ Global Topic → Subscriber (US)
 *   Publisher (APAC)─┘              → Subscriber (EU)
 *                                   → Subscriber (APAC)
 */
async function createGlobalArchitecture(projectId: string): Promise<void> {
  const pubsub = new PubSub({ projectId });

  // Create global topic for events
  const globalTopicId = 'global-events';

  try {
    const [topic] = await pubsub.createTopic(globalTopicId);
    console.log(`✓ Global topic created: ${topic.name}`);

    // Create regional subscriptions
    const regions = ['us-central1', 'europe-west1', 'asia-east1'];

    for (const region of regions) {
      const subscriptionId = `events-processor-${region}`;

      const [subscription] = await topic.createSubscription(subscriptionId, {
        ackDeadlineSeconds: 60,
        messageRetentionDuration: { seconds: 604800 },
        labels: {
          region,
          purpose: 'regional-processing',
        },
      });

      console.log(`✓ Regional subscription created: ${subscription.name}`);
      console.log(`  Region: ${region}`);
    }
  } catch (error) {
    console.error('✗ Error:', error);
    throw error;
  }
}

/**
 * Create regional topics for data residency
 */
async function createRegionalTopics(
  projectId: string,
  regions: string[]
): Promise<void> {
  const pubsub = new PubSub({ projectId });

  for (const region of regions) {
    const topicId = `orders-${region}`;

    try {
      const [topic] = await pubsub.createTopic(topicId, {
        labels: {
          region,
          purpose: 'data-residency',
        },
      });

      console.log(`✓ Regional topic created: ${topic.name}`);
      console.log(`  Region: ${region}`);
    } catch (error: any) {
      console.error(`✗ Error creating topic for ${region}:`, error.message);
    }
  }
}

/**
 * Route message to appropriate regional topic
 */
async function routeToRegionalTopic(
  projectId: string,
  data: Record<string, any>,
  userRegion: string
): Promise<string> {
  const pubsub = new PubSub({ projectId });

  const topicId = `orders-${userRegion}`;
  const topic = pubsub.topic(topicId);

  const dataBuffer = Buffer.from(JSON.stringify(data), 'utf-8');
  const messageId = await topic.publishMessage({ data: dataBuffer });

  console.log(`✓ Published to ${userRegion} topic: ${messageId}`);
  return messageId;
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const REGIONS = ['us', 'eu', 'asia'];

  (async () => {
    await createGlobalArchitecture(PROJECT_ID);
    await createRegionalTopics(PROJECT_ID, REGIONS);
  })().catch(console.error);
}

export { createGlobalArchitecture, createRegionalTopics, routeToRegionalTopic };
