#!/usr/bin/env node
/**
 * SQS Producer Script
 *
 * Send messages to an SQS queue with command-line arguments
 * Usage: ts-node producer.ts --queue-url <url> --count <number> [--local]
 */

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { parseArgs } from 'node:util';

interface ProducerConfig {
  queueUrl: string;
  count: number;
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
 * Send multiple messages to queue
 */
async function sendMessages(
  sqsClient: SQSClient,
  queueUrl: string,
  count: number
): Promise<void> {
  console.log(`Sending ${count} messages to queue...`);

  for (let i = 0; i < count; i++) {
    try {
      const message: MessagePayload = {
        message_id: i,
        data: `Message ${i}`,
        timestamp: new Date().toISOString(),
      };

      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          MessageNumber: {
            DataType: 'Number',
            StringValue: String(i),
          },
        },
      });

      const response = await sqsClient.send(command);

      console.log(`Sent message ${i}: ${response.MessageId}`);
    } catch (error) {
      console.error(`Error sending message ${i}:`, error);
      throw error;
    }
  }

  console.log(`Successfully sent ${count} messages`);
}

/**
 * Parse command-line arguments
 */
function parseArguments(): ProducerConfig {
  const { values } = parseArgs({
    options: {
      'queue-url': {
        type: 'string',
        short: 'q',
      },
      count: {
        type: 'string',
        short: 'c',
        default: '10',
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
    console.log('\nUsage: ts-node producer.ts --queue-url <url> [--count <number>] [--local]');
    console.log('\nOptions:');
    console.log('  --queue-url, -q   Queue URL (required)');
    console.log('  --count, -c       Number of messages to send (default: 10)');
    console.log('  --local, -l       Use LocalStack (default: false)');
    process.exit(1);
  }

  return {
    queueUrl: values['queue-url'] as string,
    count: parseInt(values.count as string, 10),
    local: values.local as boolean,
  };
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const config = parseArguments();

    console.log('Producer Configuration:');
    console.log(`  Queue URL: ${config.queueUrl}`);
    console.log(`  Message Count: ${config.count}`);
    console.log(`  LocalStack: ${config.local ? 'Yes' : 'No'}`);
    console.log('');

    const sqsClient = createSQSClient(config.local);

    await sendMessages(sqsClient, config.queueUrl, config.count);

    console.log('\nProducer completed successfully');
  } catch (error) {
    console.error('Producer failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { sendMessages, createSQSClient };
