/**
 * SQS Message Sending Examples
 *
 * This file demonstrates various patterns for sending messages to SQS queues,
 * including single messages, batch sends, and FIFO messages.
 */

import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
  SendMessageBatchCommand,
  SendMessageBatchCommandInput,
  SendMessageBatchCommandOutput,
  MessageAttributeValue,
} from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Interface for order message payload
 */
interface OrderMessage {
  order_id: string;
  customer: string;
  total: number;
  timestamp: string;
}

/**
 * Send a single message to a standard queue
 */
export async function sendMessage(
  queueUrl: string,
  message: OrderMessage
): Promise<string> {
  try {
    const params: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        OrderType: {
          DataType: 'String',
          StringValue: 'standard',
        },
        Priority: {
          DataType: 'String',
          StringValue: 'high',
        },
      },
    };

    const command = new SendMessageCommand(params);
    const response: SendMessageCommandOutput = await sqsClient.send(command);

    if (!response.MessageId) {
      throw new Error('MessageId not returned from API');
    }

    console.log(`Message sent: ${response.MessageId}`);
    return response.MessageId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Send batch of messages to a standard queue (up to 10 messages)
 */
export async function sendMessageBatch(
  queueUrl: string,
  messages: OrderMessage[]
): Promise<{ successful: number; failed: number }> {
  try {
    // Process in chunks of 10 (SQS batch limit)
    const results = { successful: 0, failed: 0 };

    for (let i = 0; i < messages.length; i += 10) {
      const batch = messages.slice(i, i + 10);

      const params: SendMessageBatchCommandInput = {
        QueueUrl: queueUrl,
        Entries: batch.map((msg, index) => ({
          Id: `msg-${i + index}`,
          MessageBody: JSON.stringify(msg),
          MessageAttributes: {
            Type: {
              DataType: 'String',
              StringValue: 'order',
            },
          },
        })),
      };

      const command = new SendMessageBatchCommand(params);
      const response: SendMessageBatchCommandOutput = await sqsClient.send(
        command
      );

      // Count successful and failed sends
      results.successful += response.Successful?.length || 0;
      results.failed += response.Failed?.length || 0;

      // Log any failures
      response.Failed?.forEach((failure) => {
        console.error(`Failed to send message ${failure.Id}: ${failure.Message}`);
      });

      // Log successful sends
      response.Successful?.forEach((success) => {
        console.log(`Success: ${success.Id} - ${success.MessageId}`);
      });
    }

    console.log(
      `Batch send complete: ${results.successful} successful, ${results.failed} failed`
    );
    return results;
  } catch (error) {
    console.error('Error sending message batch:', error);
    throw error;
  }
}

/**
 * Interface for FIFO message
 */
interface FifoMessage {
  order_id: string;
  action: string;
  customer: string;
}

/**
 * Send message to FIFO queue with MessageGroupId and MessageDeduplicationId
 */
export async function sendFifoMessage(
  queueUrl: string,
  message: FifoMessage,
  messageGroupId: string,
  deduplicationId: string
): Promise<{ messageId: string; sequenceNumber: string }> {
  try {
    const params: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: deduplicationId,
    };

    const command = new SendMessageCommand(params);
    const response: SendMessageCommandOutput = await sqsClient.send(command);

    if (!response.MessageId || !response.SequenceNumber) {
      throw new Error('MessageId or SequenceNumber not returned from API');
    }

    console.log(`FIFO Message ID: ${response.MessageId}`);
    console.log(`Sequence Number: ${response.SequenceNumber}`);

    return {
      messageId: response.MessageId,
      sequenceNumber: response.SequenceNumber,
    };
  } catch (error) {
    console.error('Error sending FIFO message:', error);
    throw error;
  }
}

/**
 * Send FIFO message with content-based deduplication
 * (no need to provide MessageDeduplicationId when enabled on queue)
 */
export async function sendFifoMessageWithContentDeduplication(
  queueUrl: string,
  message: FifoMessage,
  messageGroupId: string
): Promise<{ messageId: string; sequenceNumber: string }> {
  try {
    const params: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageGroupId: messageGroupId,
      // No MessageDeduplicationId - automatically generated from message body hash
    };

    const command = new SendMessageCommand(params);
    const response: SendMessageCommandOutput = await sqsClient.send(command);

    if (!response.MessageId || !response.SequenceNumber) {
      throw new Error('MessageId or SequenceNumber not returned from API');
    }

    console.log(`FIFO Message ID: ${response.MessageId}`);
    console.log(`Sequence Number: ${response.SequenceNumber}`);

    return {
      messageId: response.MessageId,
      sequenceNumber: response.SequenceNumber,
    };
  } catch (error) {
    console.error('Error sending FIFO message:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      const queueUrl =
        process.env.QUEUE_URL ||
        'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';

      // Send single message
      const orderMessage: OrderMessage = {
        order_id: '12345',
        customer: 'john@example.com',
        total: 99.99,
        timestamp: new Date().toISOString(),
      };
      await sendMessage(queueUrl, orderMessage);

      // Send batch of messages
      const batchMessages: OrderMessage[] = Array.from({ length: 25 }, (_, i) => ({
        order_id: `ORD-${i + 1}`,
        customer: `customer${i + 1}@example.com`,
        total: 10.0 + i * 5,
        timestamp: new Date().toISOString(),
      }));
      await sendMessageBatch(queueUrl, batchMessages);

      // Send FIFO message (if using FIFO queue)
      const fifoQueueUrl = queueUrl.replace(/\/([^/]+)$/, '/$1.fifo');
      const fifoMessage: FifoMessage = {
        order_id: '12345',
        action: 'create',
        customer: 'john@example.com',
      };
      await sendFifoMessage(
        fifoQueueUrl,
        fifoMessage,
        'order-group-1',
        'unique-id-12345'
      );
    } catch (error) {
      console.error('Failed to send messages:', error);
      process.exit(1);
    }
  })();
}
