/**
 * SNS Publishing Examples
 *
 * Demonstrates various ways to publish messages to SNS topics
 */

import {
  SNSClient,
  PublishCommand,
  PublishCommandInput,
  PublishBatchCommand,
  PublishBatchCommandInput,
  MessageAttributeValue,
} from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface OrderEvent {
  order_id: string;
  customer: string;
  total: number;
  items: Array<{ product: string; quantity: number }>;
}

/**
 * Publish simple message to SNS topic
 */
export async function publishMessage(
  topicArn: string,
  message: string,
  subject?: string
): Promise<string> {
  try {
    const params: PublishCommandInput = {
      TopicArn: topicArn,
      Message: message,
      Subject: subject || 'Notification',
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    if (!response.MessageId) {
      throw new Error('MessageId not returned from API');
    }

    console.log(`Published message: ${response.MessageId}`);
    return response.MessageId;
  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
}

/**
 * Publish JSON message with attributes
 */
export async function publishJsonMessage(
  topicArn: string,
  data: OrderEvent
): Promise<string> {
  try {
    const params: PublishCommandInput = {
      TopicArn: topicArn,
      Message: JSON.stringify(data),
      Subject: 'New Order Created',
      MessageAttributes: {
        event_type: {
          DataType: 'String',
          StringValue: 'order.created',
        },
        order_value: {
          DataType: 'Number',
          StringValue: data.total.toString(),
        },
        customer_tier: {
          DataType: 'String',
          StringValue: 'premium',
        },
      },
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    if (!response.MessageId) {
      throw new Error('MessageId not returned from API');
    }

    console.log(`Published JSON message: ${response.MessageId}`);
    return response.MessageId;
  } catch (error) {
    console.error('Error publishing JSON message:', error);
    throw error;
  }
}

/**
 * Publish protocol-specific messages
 */
export async function publishProtocolSpecificMessage(
  topicArn: string,
  orderData: OrderEvent
): Promise<string> {
  try {
    // Define different messages for different protocols
    const messageStructure = {
      default: 'New order received',
      email: `You have a new order: #${orderData.order_id}\nTotal: $${orderData.total}`,
      sms: `New order #${orderData.order_id}`,
      sqs: JSON.stringify({
        order_id: orderData.order_id,
        total: orderData.total,
        timestamp: new Date().toISOString(),
      }),
      lambda: JSON.stringify({
        event_type: 'order.created',
        order_id: orderData.order_id,
      }),
    };

    const params: PublishCommandInput = {
      TopicArn: topicArn,
      Message: JSON.stringify(messageStructure),
      Subject: 'New Order',
      MessageStructure: 'json', // Important for protocol-specific messages
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    if (!response.MessageId) {
      throw new Error('MessageId not returned from API');
    }

    console.log(`Published protocol-specific message: ${response.MessageId}`);
    return response.MessageId;
  } catch (error) {
    console.error('Error publishing protocol-specific message:', error);
    throw error;
  }
}

/**
 * Publish to FIFO topic
 */
export async function publishFifoMessage(
  topicArn: string,
  message: OrderEvent,
  messageGroupId: string,
  deduplicationId: string
): Promise<{ messageId: string; sequenceNumber: string }> {
  try {
    const params: PublishCommandInput = {
      TopicArn: topicArn,
      Message: JSON.stringify(message),
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: deduplicationId,
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

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
    console.error('Error publishing FIFO message:', error);
    throw error;
  }
}

/**
 * Publish batch messages (up to 10)
 */
export async function publishBatchMessages(
  topicArn: string,
  messages: Array<{ id: string; message: string; subject?: string }>
): Promise<{ successful: number; failed: number }> {
  try {
    const params: PublishBatchCommandInput = {
      TopicArn: topicArn,
      PublishBatchRequestEntries: messages.map((msg) => ({
        Id: msg.id,
        Message: msg.message,
        Subject: msg.subject || 'Notification',
      })),
    };

    const command = new PublishBatchCommand(params);
    const response = await snsClient.send(command);

    const results = {
      successful: response.Successful?.length || 0,
      failed: response.Failed?.length || 0,
    };

    // Log failures
    response.Failed?.forEach((failure) => {
      console.error(`Failed to publish ${failure.Id}: ${failure.Message}`);
    });

    console.log(
      `Batch publish: ${results.successful} successful, ${results.failed} failed`
    );
    return results;
  } catch (error) {
    console.error('Error publishing batch:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      const topicArn =
        process.env.TOPIC_ARN ||
        'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Publish simple message
      await publishMessage(topicArn, 'Hello from SNS!', 'Test Message');

      // Publish JSON order event
      const orderData: OrderEvent = {
        order_id: '12345',
        customer: 'john@example.com',
        total: 99.99,
        items: [
          { product: 'Widget', quantity: 2 },
          { product: 'Gadget', quantity: 1 },
        ],
      };
      await publishJsonMessage(topicArn, orderData);

      // Publish protocol-specific
      await publishProtocolSpecificMessage(topicArn, orderData);

      // Publish batch
      const batchMessages = Array.from({ length: 5 }, (_, i) => ({
        id: `msg-${i}`,
        message: `Batch message ${i}`,
        subject: `Subject ${i}`,
      }));
      await publishBatchMessages(topicArn, batchMessages);
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}
