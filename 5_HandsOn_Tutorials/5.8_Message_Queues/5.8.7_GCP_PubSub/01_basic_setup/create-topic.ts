// create-topic.ts
import { PubSub, Topic } from '@google-cloud/pubsub';

/**
 * Create a new Pub/Sub topic
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The ID of the topic to create
 * @returns The created topic
 */
async function createTopic(projectId: string, topicId: string): Promise<Topic | null> {
  const pubsub = new PubSub({ projectId });
  const topicName = `projects/${projectId}/topics/${topicId}`;

  try {
    const [topic] = await pubsub.createTopic(topicId);
    console.log(`✓ Topic created: ${topic.name}`);
    return topic;
  } catch (error: any) {
    if (error.code === 6) { // ALREADY_EXISTS
      console.log(`Topic ${topicName} already exists`);
      return null;
    }
    console.error('✗ Error creating topic:', error);
    throw error;
  }
}

/**
 * List all topics in the project
 *
 * @param projectId - Your GCP project ID
 */
async function listTopics(projectId: string): Promise<void> {
  const pubsub = new PubSub({ projectId });

  console.log(`\nTopics in project ${projectId}:`);
  const [topics] = await pubsub.getTopics();

  topics.forEach(topic => {
    console.log(`  - ${topic.name}`);
  });
}

/**
 * Delete a Pub/Sub topic
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic ID to delete
 */
async function deleteTopic(projectId: string, topicId: string): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  try {
    await topic.delete();
    console.log(`✓ Topic deleted: ${topicId}`);
  } catch (error) {
    console.error('✗ Error deleting topic:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'my-first-topic';

  (async () => {
    // Create topic
    await createTopic(PROJECT_ID, TOPIC_ID);

    // List topics
    await listTopics(PROJECT_ID);

    // Delete topic (uncomment to test)
    // await deleteTopic(PROJECT_ID, TOPIC_ID);
  })().catch(console.error);
}

export { createTopic, listTopics, deleteTopic };
