// setup-dead-letter.ts
import { PubSub, Topic, Subscription } from '@google-cloud/pubsub';

/**
 * Create a topic to receive dead letter messages
 *
 * @param projectId - Your GCP project ID
 * @param deadLetterTopicId - The dead letter topic ID
 */
async function createDeadLetterTopic(
  projectId: string,
  deadLetterTopicId: string
): Promise<Topic> {
  const pubsub = new PubSub({ projectId });

  try {
    const [topic] = await pubsub.createTopic(deadLetterTopicId);
    console.log(`✓ Dead letter topic created: ${topic.name}`);
    return topic;
  } catch (error) {
    console.error('✗ Error creating topic:', error);
    throw error;
  }
}

/**
 * Create a subscription with dead letter topic
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The main topic
 * @param subscriptionId - The subscription ID
 * @param deadLetterTopicId - The dead letter topic ID
 * @param maxDeliveryAttempts - Max attempts before sending to DLT (5-100)
 */
async function createSubscriptionWithDeadLetter(
  projectId: string,
  topicId: string,
  subscriptionId: string,
  deadLetterTopicId: string,
  maxDeliveryAttempts: number = 5
): Promise<Subscription> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);
  const deadLetterTopicPath = `projects/${projectId}/topics/${deadLetterTopicId}`;

  try {
    const [subscription] = await topic.createSubscription(subscriptionId, {
      ackDeadlineSeconds: 60,
      deadLetterPolicy: {
        deadLetterTopic: deadLetterTopicPath,
        maxDeliveryAttempts,
      },
    });

    console.log(`✓ Subscription created: ${subscription.name}`);
    console.log(`  Dead letter topic: ${deadLetterTopicPath}`);
    console.log(`  Max delivery attempts: ${maxDeliveryAttempts}`);
    return subscription;
  } catch (error) {
    console.error('✗ Error creating subscription:', error);
    throw error;
  }
}

/**
 * Create subscription with both DLT and retry policy
 */
async function createSubscriptionWithDltAndRetry(
  projectId: string,
  topicId: string,
  subscriptionId: string,
  deadLetterTopicId: string,
  maxDeliveryAttempts: number = 5,
  minBackoffSeconds: number = 10,
  maxBackoffSeconds: number = 600
): Promise<Subscription> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);
  const deadLetterTopicPath = `projects/${projectId}/topics/${deadLetterTopicId}`;

  const [subscription] = await topic.createSubscription(subscriptionId, {
    ackDeadlineSeconds: 60,
    retryPolicy: {
      minimumBackoff: { seconds: minBackoffSeconds },
      maximumBackoff: { seconds: maxBackoffSeconds },
    },
    deadLetterPolicy: {
      deadLetterTopic: deadLetterTopicPath,
      maxDeliveryAttempts,
    },
  });

  console.log('✓ Subscription created with DLT and retry policy');
  console.log(`  Max attempts: ${maxDeliveryAttempts}`);
  console.log(`  Backoff: ${minBackoffSeconds}s - ${maxBackoffSeconds}s`);
  return subscription;
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'main-topic';
  const SUBSCRIPTION_ID = 'main-subscription';
  const DLT_TOPIC_ID = 'dead-letter-topic';

  (async () => {
    // Create dead letter topic
    await createDeadLetterTopic(PROJECT_ID, DLT_TOPIC_ID);

    // Create subscription with DLT
    await createSubscriptionWithDeadLetter(
      PROJECT_ID,
      TOPIC_ID,
      SUBSCRIPTION_ID,
      DLT_TOPIC_ID,
      5
    );
  })().catch(console.error);
}

export {
  createDeadLetterTopic,
  createSubscriptionWithDeadLetter,
  createSubscriptionWithDltAndRetry,
};
