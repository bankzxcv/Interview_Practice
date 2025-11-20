#!/usr/bin/env node
/**
 * SQS Consumer Script
 *
 * Process messages from an SQS queue with command-line arguments
 * Usage: ts-node consumer.ts --queue-url <url> [--local]
 */

import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { parseArgs } from 'node:util';

interface ConsumerConfig {
  queueUrl: string;
  local: boolean;
}

interface MessagePayload {
  message_id: number;
  data: string;
  timestamp: string;
}

/**
 * Create SQS client for AWS or LocalStack
 */
function createSQSClient(isLocal: boolean): SQSClient {
  if (isLocal) {
    return new SQSClient({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });
  }

  return new SQSClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });
}

/**
 * Process individual message
 */
async function processMessage(message: Message): Promise<void> {
  try {
    if (!message.Body) {
      throw new Error('Message body is empty');
    }

    const body: MessagePayload = JSON.parse(message.Body);
    console.log(`Processing: ${JSON.stringify(body, null, 2)}`);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`Processed message ${body.message_id} successfully`);
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

/**
 * Consume messages from queue continuously
 */
async function consumeMessages(
  sqsClient: SQSClient,
  queueUrl: string
): Promise<void> {
  console.log(`Starting consumer for queue: ${queueUrl}`);
  console.log('Waiting for messages... (Press Ctrl+C to stop)\n');

  let running = true;
  let totalProcessed = 0;
  let totalFailed = 0;

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down consumer...');
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`Total failed: ${totalFailed}`);
    running = false;
  });

  while (running) {
    try {
      // Receive messages with long polling
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(receiveCommand);
      const messages = response.Messages || [];

      if (messages.length === 0) {
        console.log('No messages, waiting...');
        continue;
      }

      console.log(`\nReceived ${messages.length} messages`);

      // Process each message
      for (const message of messages) {
        try {
          if (!message.ReceiptHandle) {
            console.warn('Message missing ReceiptHandle, skipping');
            continue;
          }

          // Process message
          await processMessage(message);

          // Delete message after successful processing
          const deleteCommand = new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          });

          await sqsClient.send(deleteCommand);
          console.log(`Deleted message: ${message.MessageId}\n`);

          totalProcessed++;
        } catch (error) {
          console.error(`Error processing message ${message.MessageId}:`, error);
          totalFailed++;
          // Message will reappear after visibility timeout
        }
      }
    } catch (error) {
      console.error('Error in consumer loop:', error);
      // Wait before retrying on error
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log('Consumer stopped');
  process.exit(0);
}

/**
 * Parse command-line arguments
 */
function parseArguments(): ConsumerConfig {
  const { values } = parseArgs({
    options: {
      'queue-url': {
        type: 'string',
        short: 'q',
      },
      local: {
        type: 'boolean',
        short: 'l',
        default: false,
      },
    },
  });

  if (!values['queue-url']) {
    console.error('Error: --queue-url is required');
    console.log('\nUsage: ts-node consumer.ts --queue-url <url> [--local]');
    console.log('\nOptions:');
    console.log('  --queue-url, -q   Queue URL (required)');
    console.log('  --local, -l       Use LocalStack (default: false)');
    process.exit(1);
  }

  return {
    queueUrl: values['queue-url'] as string,
    local: values.local as boolean,
  };
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const config = parseArguments();

    console.log('Consumer Configuration:');
    console.log(`  Queue URL: ${config.queueUrl}`);
    console.log(`  LocalStack: ${config.local ? 'Yes' : 'No'}`);
    console.log('');

    const sqsClient = createSQSClient(config.local);

    await consumeMessages(sqsClient, config.queueUrl);
  } catch (error) {
    console.error('Consumer failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { consumeMessages, createSQSClient };
