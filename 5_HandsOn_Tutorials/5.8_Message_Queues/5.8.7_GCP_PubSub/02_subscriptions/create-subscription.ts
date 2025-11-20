// create-subscription.ts
import { PubSub, Subscription, Duration } from '@google-cloud/pubsub';

/**
 * Create a pull subscription
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to subscribe to
 * @param subscriptionId - ID for the new subscription
 * @param ackDeadlineSeconds - Acknowledgment deadline (10-600 seconds)
 */
async function createPullSubscription(
  projectId: string,
  topicId: string,
  subscriptionId: string,
  ackDeadlineSeconds: number = 60
): Promise<Subscription | null> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  try {
    const [subscription] = await topic.createSubscription(subscriptionId, {
      ackDeadlineSeconds,
      messageRetentionDuration: { seconds: 604800 }, // 7 days
      retainAckedMessages: false,
      enableMessageOrdering: false,
    });

    console.log(`✓ Subscription created: ${subscription.name}`);
    return subscription;
  } catch (error: any) {
    if (error.code === 6) { // ALREADY_EXISTS
      console.log(`Subscription ${subscriptionId} already exists`);
      return null;
    }
    console.error('✗ Error creating subscription:', error);
    throw error;
  }
}

/**
 * Create a subscription with message filtering
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to subscribe to
 * @param subscriptionId - ID for the new subscription
 * @param filterString - Filter expression (e.g., 'attributes.event_type="order.created"')
 */
async function createSubscriptionWithFilter(
  projectId: string,
  topicId: string,
  subscriptionId: string,
  filterString: string
): Promise<Subscription | null> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  try {
    const [subscription] = await topic.createSubscription(subscriptionId, {
      filter: filterString,
    });

    console.log(`✓ Filtered subscription created: ${subscription.name}`);
    console.log(`  Filter: ${filterString}`);
    return subscription;
  } catch (error) {
    console.error('✗ Error creating subscription:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'my-topic';

  (async () => {
    // Create basic subscription
    await createPullSubscription(PROJECT_ID, TOPIC_ID, 'basic-sub');

    // Create filtered subscriptions
    await createSubscriptionWithFilter(
      PROJECT_ID,
      TOPIC_ID,
      'order-created-sub',
      'attributes.event_type="order.created"'
    );

    await createSubscriptionWithFilter(
      PROJECT_ID,
      TOPIC_ID,
      'high-priority-sub',
      'attributes.priority="high"'
    );
  })().catch(console.error);
}

export { createPullSubscription, createSubscriptionWithFilter };
