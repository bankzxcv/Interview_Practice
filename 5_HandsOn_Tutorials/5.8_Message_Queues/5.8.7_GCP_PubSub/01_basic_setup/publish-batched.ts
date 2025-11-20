// publish-batched.ts
import { PubSub, PublishOptions } from '@google-cloud/pubsub';

/**
 * Publish messages with optimized batch settings
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 * @param messageCount - Number of messages to publish
 */
async function publishWithBatchSettings(
  projectId: string,
  topicId: string,
  messageCount: number
): Promise<void> {
  // Configure batch settings
  const batchSettings: PublishOptions = {
    batching: {
      maxMessages: 100,  // Maximum messages per batch
      maxBytes: 1024 * 1024,  // Maximum batch size in bytes (1 MB)
      maxMilliseconds: 100,  // Maximum time to wait (milliseconds)
    },
  };

  // Create publisher with batch settings
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId, batchSettings);

  const publishPromises: Promise<string>[] = [];
  const startTime = Date.now();

  // Publish messages
  for (let i = 0; i < messageCount; i++) {
    const dataBuffer = Buffer.from(`Batched message ${i}`, 'utf-8');
    const promise = topic.publishMessage({ data: dataBuffer });
    publishPromises.push(promise);

    if ((i + 1) % 1000 === 0) {
      console.log(`Queued ${i + 1} messages...`);
    }
  }

  // Wait for all messages to be published
  const messageIds = await Promise.all(publishPromises);

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`\n✓ Published ${messageCount} messages in ${elapsed.toFixed(2)} seconds`);
  console.log(`Throughput: ${(messageCount / elapsed).toFixed(2)} messages/second`);

  // Check for any errors (all promises resolved successfully if we got here)
  console.log(`✓ All ${messageIds.length} messages published successfully`);
}

/**
 * Publish with custom retry settings
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 */
async function publishWithCustomRetry(
  projectId: string,
  topicId: string
): Promise<string> {
  // Custom retry settings
  const publishOptions: PublishOptions = {
    gaxOpts: {
      retry: {
        retryCodes: [10, 14],  // ABORTED, UNAVAILABLE
        backoffSettings: {
          initialRetryDelayMillis: 100,
          retryDelayMultiplier: 2.0,
          maxRetryDelayMillis: 60000,
          initialRpcTimeoutMillis: 5000,
          rpcTimeoutMultiplier: 1.0,
          maxRpcTimeoutMillis: 600000,
          totalTimeoutMillis: 600000,
        },
      },
    },
  };

  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId, publishOptions);

  const dataBuffer = Buffer.from('Message with custom retry', 'utf-8');
  const messageId = await topic.publishMessage({ data: dataBuffer });

  console.log(`✓ Published with custom retry (ID: ${messageId})`);
  return messageId;
}

/**
 * Publish with flow control to limit memory usage
 *
 * @param projectId - Your GCP project ID
 * @param topicId - The topic to publish to
 */
async function publishWithFlowControl(
  projectId: string,
  topicId: string
): Promise<void> {
  // Flow control settings
  const publishOptions: PublishOptions = {
    batching: {
      maxMessages: 1000,  // Maximum outstanding messages
      maxBytes: 10 * 1024 * 1024,  // Maximum outstanding bytes (10 MB)
    },
    flowControlOptions: {
      maxOutstandingMessages: 1000,
      maxOutstandingBytes: 10 * 1024 * 1024,
    },
  };

  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId, publishOptions);

  // Publish many messages - will block when limit reached
  const promises: Promise<string>[] = [];

  for (let i = 0; i < 5000; i++) {
    const dataBuffer = Buffer.from(`Flow controlled message ${i}`, 'utf-8');
    promises.push(topic.publishMessage({ data: dataBuffer }));

    if (i % 500 === 0) {
      console.log(`Published ${i} messages (with flow control)...`);
    }
  }

  await Promise.all(promises);
  console.log('✓ All messages published with flow control');
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const TOPIC_ID = 'batched-topic';

  (async () => {
    // Publish with batch settings
    await publishWithBatchSettings(PROJECT_ID, TOPIC_ID, 10000);

    // Publish with custom retry
    await publishWithCustomRetry(PROJECT_ID, TOPIC_ID);

    // Publish with flow control
    // await publishWithFlowControl(PROJECT_ID, TOPIC_ID);
  })().catch(console.error);
}

export { publishWithBatchSettings, publishWithCustomRetry, publishWithFlowControl };
