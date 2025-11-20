/**
 * SQS Queue Creation Examples
 *
 * This file demonstrates how to create Standard and FIFO SQS queues
 * using AWS SDK v3 with TypeScript.
 */

import {
  SQSClient,
  CreateQueueCommand,
  CreateQueueCommandInput,
  CreateQueueCommandOutput,
  QueueAttributeName,
} from '@aws-sdk/client-sqs';

// Initialize SQS client with proper configuration
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Optional: credentials can be provided here or use default credential chain
});

/**
 * Create a standard SQS queue with basic attributes
 */
export async function createStandardQueue(
  queueName: string
): Promise<string> {
  try {
    const params: CreateQueueCommandInput = {
      QueueName: queueName,
      Attributes: {
        [QueueAttributeName.DelaySeconds]: '0',
        [QueueAttributeName.MessageRetentionPeriod]: '345600', // 4 days
        [QueueAttributeName.VisibilityTimeout]: '30',
        [QueueAttributeName.ReceiveMessageWaitTimeSeconds]: '20', // Long polling
      },
    };

    const command = new CreateQueueCommand(params);
    const response: CreateQueueCommandOutput = await sqsClient.send(command);

    if (!response.QueueUrl) {
      throw new Error('Queue URL not returned from API');
    }

    console.log(`Standard queue created: ${response.QueueUrl}`);
    return response.QueueUrl;
  } catch (error) {
    console.error('Error creating standard queue:', error);
    throw error;
  }
}

/**
 * Create a FIFO SQS queue with content-based deduplication
 */
export async function createFifoQueue(
  queueName: string
): Promise<string> {
  try {
    // FIFO queue names must end with .fifo
    const fifoQueueName = queueName.endsWith('.fifo')
      ? queueName
      : `${queueName}.fifo`;

    const params: CreateQueueCommandInput = {
      QueueName: fifoQueueName,
      Attributes: {
        [QueueAttributeName.FifoQueue]: 'true',
        [QueueAttributeName.ContentBasedDeduplication]: 'true',
        [QueueAttributeName.MessageRetentionPeriod]: '345600',
        [QueueAttributeName.VisibilityTimeout]: '30',
      },
    };

    const command = new CreateQueueCommand(params);
    const response: CreateQueueCommandOutput = await sqsClient.send(command);

    if (!response.QueueUrl) {
      throw new Error('Queue URL not returned from API');
    }

    console.log(`FIFO queue created: ${response.QueueUrl}`);
    return response.QueueUrl;
  } catch (error) {
    console.error('Error creating FIFO queue:', error);
    throw error;
  }
}

/**
 * Create a high-throughput FIFO queue
 */
export async function createHighThroughputFifoQueue(
  queueName: string
): Promise<string> {
  try {
    const fifoQueueName = queueName.endsWith('.fifo')
      ? queueName
      : `${queueName}.fifo`;

    const params: CreateQueueCommandInput = {
      QueueName: fifoQueueName,
      Attributes: {
        [QueueAttributeName.FifoQueue]: 'true',
        [QueueAttributeName.ContentBasedDeduplication]: 'true',
        [QueueAttributeName.DeduplicationScope]: 'messageGroup',
        [QueueAttributeName.FifoThroughputLimit]: 'perMessageGroupId',
      },
    };

    const command = new CreateQueueCommand(params);
    const response: CreateQueueCommandOutput = await sqsClient.send(command);

    if (!response.QueueUrl) {
      throw new Error('Queue URL not returned from API');
    }

    console.log(`High-throughput FIFO queue created: ${response.QueueUrl}`);
    return response.QueueUrl;
  } catch (error) {
    console.error('Error creating high-throughput FIFO queue:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Create standard queue
      const standardQueueUrl = await createStandardQueue('my-standard-queue');
      console.log('Standard Queue URL:', standardQueueUrl);

      // Create FIFO queue
      const fifoQueueUrl = await createFifoQueue('my-fifo-queue');
      console.log('FIFO Queue URL:', fifoQueueUrl);

      // Create high-throughput FIFO queue
      const highThroughputQueueUrl = await createHighThroughputFifoQueue(
        'my-high-throughput-queue'
      );
      console.log('High-Throughput Queue URL:', highThroughputQueueUrl);
    } catch (error) {
      console.error('Failed to create queues:', error);
      process.exit(1);
    }
  })();
}
