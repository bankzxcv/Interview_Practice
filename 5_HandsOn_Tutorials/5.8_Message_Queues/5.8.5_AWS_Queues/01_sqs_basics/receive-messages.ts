/**
 * SQS Message Receiving Examples
 *
 * This file demonstrates various patterns for receiving and processing messages
 * from SQS queues, including long polling and consumer loops.
 */

import {
  SQSClient,
  ReceiveMessageCommand,
  ReceiveMessageCommandInput,
  ReceiveMessageCommandOutput,
  DeleteMessageCommand,
  DeleteMessageCommandInput,
  Message,
  ChangeMessageVisibilityCommand,
  ChangeMessageVisibilityCommandInput,
} from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Interface for parsed message body
 */
interface OrderMessage {
  order_id: string;
  customer: string;
  total: number;
  timestamp?: string;
}

/**
 * Receive messages using short polling (returns immediately)
 */
export async function receiveMessagesShortPolling(
  queueUrl: string,
  maxMessages: number = 10
): Promise<Message[]> {
  try {
    const params: ReceiveMessageCommandInput = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages, // Max 10
      MessageAttributeNames: ['All'],
      AttributeNames: ['All'],
    };

    const command = new ReceiveMessageCommand(params);
    const response: ReceiveMessageCommandOutput = await sqsClient.send(command);

    const messages = response.Messages || [];
    console.log(`Received ${messages.length} messages (short polling)`);

    for (const message of messages) {
      console.log(`Message ID: ${message.MessageId}`);
      console.log(`Body: ${message.Body}`);
      console.log(`Receipt Handle: ${message.ReceiptHandle}`);
    }

    return messages;
  } catch (error) {
    console.error('Error receiving messages:', error);
    throw error;
  }
}

/**
 * Receive messages using long polling (recommended)
 */
export async function receiveMessagesLongPolling(
  queueUrl: string,
  maxMessages: number = 10
): Promise<Message[]> {
  try {
    const params: ReceiveMessageCommandInput = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20, // Long polling (1-20 seconds)
      MessageAttributeNames: ['All'],
      AttributeNames: ['All'],
    };

    const command = new ReceiveMessageCommand(params);
    const response: ReceiveMessageCommandOutput = await sqsClient.send(command);

    const messages = response.Messages || [];
    console.log(`Received ${messages.length} messages (long polling)`);

    return messages;
  } catch (error) {
    console.error('Error receiving messages:', error);
    throw error;
  }
}

/**
 * Delete a message from the queue after successful processing
 */
export async function deleteMessage(
  queueUrl: string,
  receiptHandle: string
): Promise<void> {
  try {
    const params: DeleteMessageCommandInput = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    };

    const command = new DeleteMessageCommand(params);
    await sqsClient.send(command);

    console.log('Message deleted successfully');
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Process a single message
 */
async function processMessage(messageBody: string): Promise<void> {
  try {
    const data: OrderMessage = JSON.parse(messageBody);
    console.log(`Processing order: ${data.order_id} for ${data.customer}`);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`Order ${data.order_id} processed successfully`);
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

/**
 * Receive and process messages with proper error handling
 */
export async function receiveAndProcessMessages(
  queueUrl: string,
  maxMessages: number = 10
): Promise<{ processed: number; failed: number }> {
  try {
    const messages = await receiveMessagesLongPolling(queueUrl, maxMessages);
    const results = { processed: 0, failed: 0 };

    for (const message of messages) {
      try {
        if (!message.Body || !message.ReceiptHandle) {
          console.warn('Message missing Body or ReceiptHandle');
          continue;
        }

        // Process message
        await processMessage(message.Body);

        // Delete message after successful processing
        await deleteMessage(queueUrl, message.ReceiptHandle);

        results.processed++;
      } catch (error) {
        console.error(`Error processing message ${message.MessageId}:`, error);
        results.failed++;
        // Message will become visible again after visibility timeout
      }
    }

    console.log(
      `Processed: ${results.processed}, Failed: ${results.failed}`
    );
    return results;
  } catch (error) {
    console.error('Error in receive and process:', error);
    throw error;
  }
}

/**
 * Extend visibility timeout for a message (for long-running processing)
 */
export async function extendVisibilityTimeout(
  queueUrl: string,
  receiptHandle: string,
  timeoutSeconds: number
): Promise<void> {
  try {
    const params: ChangeMessageVisibilityCommandInput = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: timeoutSeconds,
    };

    const command = new ChangeMessageVisibilityCommand(params);
    await sqsClient.send(command);

    console.log(`Visibility timeout extended to ${timeoutSeconds} seconds`);
  } catch (error) {
    console.error('Error extending visibility timeout:', error);
    throw error;
  }
}

/**
 * Consumer loop - continuously poll and process messages
 */
export async function startConsumerLoop(
  queueUrl: string,
  maxMessages: number = 10
): Promise<void> {
  console.log(`Starting consumer loop for queue: ${queueUrl}`);
  console.log('Press Ctrl+C to stop...');

  let running = true;

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down consumer...');
    running = false;
  });

  while (running) {
    try {
      const messages = await receiveMessagesLongPolling(queueUrl, maxMessages);

      if (messages.length === 0) {
        console.log('No messages, waiting...');
        continue;
      }

      console.log(`Received ${messages.length} messages`);

      // Process messages
      for (const message of messages) {
        try {
          if (!message.Body || !message.ReceiptHandle) {
            continue;
          }

          await processMessage(message.Body);
          await deleteMessage(queueUrl, message.ReceiptHandle);

          console.log(`Message ${message.MessageId} deleted`);
        } catch (error) {
          console.error(`Error processing message:`, error);
          // Message will reappear after visibility timeout
        }
      }
    } catch (error) {
      console.error('Error in consumer loop:', error);
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log('Consumer stopped');
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      const queueUrl =
        process.env.QUEUE_URL ||
        'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';

      // Option 1: Receive and process once
      // await receiveAndProcessMessages(queueUrl, 10);

      // Option 2: Start continuous consumer loop
      await startConsumerLoop(queueUrl, 10);
    } catch (error) {
      console.error('Consumer failed:', error);
      process.exit(1);
    }
  })();
}
