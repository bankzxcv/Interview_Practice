/**
 * LocalStack Development Examples
 *
 * This file demonstrates how to develop and test SQS applications locally
 * using LocalStack without incurring AWS costs.
 */

import {
  SQSClient,
  CreateQueueCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ListQueuesCommand,
} from '@aws-sdk/client-sqs';

/**
 * Create SQS client configured for LocalStack
 */
function createLocalStackClient(): SQSClient {
  return new SQSClient({
    endpoint: 'http://localhost:4566', // LocalStack endpoint
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test', // Dummy credentials for LocalStack
      secretAccessKey: 'test',
    },
  });
}

/**
 * Create a queue in LocalStack
 */
async function createLocalQueue(
  sqsClient: SQSClient,
  queueName: string
): Promise<string> {
  try {
    const command = new CreateQueueCommand({
      QueueName: queueName,
      Attributes: {
        VisibilityTimeout: '30',
        MessageRetentionPeriod: '345600',
        ReceiveMessageWaitTimeSeconds: '20',
      },
    });

    const response = await sqsClient.send(command);

    if (!response.QueueUrl) {
      throw new Error('Queue URL not returned');
    }

    console.log(`Local queue created: ${response.QueueUrl}`);
    return response.QueueUrl;
  } catch (error) {
    console.error('Error creating local queue:', error);
    throw error;
  }
}

/**
 * List all queues in LocalStack
 */
async function listLocalQueues(sqsClient: SQSClient): Promise<string[]> {
  try {
    const command = new ListQueuesCommand({});
    const response = await sqsClient.send(command);

    const queueUrls = response.QueueUrls || [];
    console.log(`Found ${queueUrls.length} queues:`);
    queueUrls.forEach((url) => console.log(`  - ${url}`));

    return queueUrls;
  } catch (error) {
    console.error('Error listing queues:', error);
    throw error;
  }
}

/**
 * Send message to LocalStack queue
 */
async function sendLocalMessage(
  sqsClient: SQSClient,
  queueUrl: string,
  message: Record<string, any>
): Promise<string> {
  try {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    });

    const response = await sqsClient.send(command);

    if (!response.MessageId) {
      throw new Error('MessageId not returned');
    }

    console.log(`Message sent to LocalStack: ${response.MessageId}`);
    return response.MessageId;
  } catch (error) {
    console.error('Error sending message to LocalStack:', error);
    throw error;
  }
}

/**
 * Receive and process message from LocalStack queue
 */
async function receiveLocalMessage(
  sqsClient: SQSClient,
  queueUrl: string
): Promise<void> {
  try {
    const receiveCommand = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 5,
    });

    const response = await sqsClient.send(receiveCommand);
    const messages = response.Messages || [];

    if (messages.length === 0) {
      console.log('No messages in queue');
      return;
    }

    for (const message of messages) {
      console.log('Received message:');
      console.log(`  MessageId: ${message.MessageId}`);
      console.log(`  Body: ${message.Body}`);

      // Delete message after processing
      if (message.ReceiptHandle) {
        const deleteCommand = new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        });

        await sqsClient.send(deleteCommand);
        console.log('  Message deleted');
      }
    }
  } catch (error) {
    console.error('Error receiving message from LocalStack:', error);
    throw error;
  }
}

/**
 * Complete LocalStack workflow example
 */
async function runLocalStackExample(): Promise<void> {
  console.log('=== LocalStack SQS Example ===\n');

  try {
    // Create LocalStack client
    const sqsClient = createLocalStackClient();
    console.log('✓ Connected to LocalStack\n');

    // Create queue
    const queueName = 'local-test-queue';
    const queueUrl = await createLocalQueue(sqsClient, queueName);
    console.log('');

    // List queues
    await listLocalQueues(sqsClient);
    console.log('');

    // Send messages
    console.log('Sending messages...');
    for (let i = 1; i <= 5; i++) {
      const message = {
        id: i,
        data: `Test message ${i}`,
        timestamp: new Date().toISOString(),
      };
      await sendLocalMessage(sqsClient, queueUrl, message);
    }
    console.log('');

    // Receive and process messages
    console.log('Receiving messages...');
    for (let i = 0; i < 5; i++) {
      await receiveLocalMessage(sqsClient, queueUrl);
    }

    console.log('\n✓ LocalStack example completed successfully');
  } catch (error) {
    console.error('LocalStack example failed:', error);
    throw error;
  }
}

/**
 * Docker Compose setup instructions
 */
function printDockerSetup(): void {
  console.log('\n=== LocalStack Setup Instructions ===\n');
  console.log('1. Create docker-compose.yml:');
  console.log(`
version: '3.8'
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=sqs
      - DEBUG=1
    volumes:
      - ./localstack-data:/tmp/localstack
  `);

  console.log('\n2. Start LocalStack:');
  console.log('   docker-compose up -d');

  console.log('\n3. Verify LocalStack is running:');
  console.log('   curl http://localhost:4566/_localstack/health');

  console.log('\n4. Run this example:');
  console.log('   ts-node localstack-example.ts');

  console.log('\n5. Stop LocalStack:');
  console.log('   docker-compose down');
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Check if --help flag is provided
      if (process.argv.includes('--help') || process.argv.includes('-h')) {
        printDockerSetup();
        process.exit(0);
      }

      await runLocalStackExample();
    } catch (error) {
      console.error('Example failed:', error);
      console.log('\nMake sure LocalStack is running:');
      console.log('  docker run -d -p 4566:4566 localstack/localstack');
      process.exit(1);
    }
  })();
}

export {
  createLocalStackClient,
  createLocalQueue,
  sendLocalMessage,
  receiveLocalMessage,
  listLocalQueues,
};
