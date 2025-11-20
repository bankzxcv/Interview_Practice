/**
 * Lambda Handler for SQS Event Source
 *
 * Production-ready Lambda function for processing SQS messages
 */

import { SQSEvent, SQSRecord, SQSBatchResponse, Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });

interface OrderMessage {
  order_id: string;
  customer: string;
  total: number;
  items: Array<{ product_id: string; quantity: number }>;
}

/**
 * Lambda handler for SQS events with partial batch failure support
 */
export async function handler(
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> {
  console.log('Function:', context.functionName);
  console.log('Received', event.Records.length, 'messages');
  console.log('Remaining time:', context.getRemainingTimeInMillis(), 'ms');

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
      console.log('Success:', record.messageId);
    } catch (error) {
      console.error('Failed:', record.messageId, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  console.log('Processed:', event.Records.length - batchItemFailures.length);
  console.log('Failed:', batchItemFailures.length);

  // Return failed messages for retry
  return { batchItemFailures };
}

/**
 * Process individual SQS record
 */
async function processRecord(record: SQSRecord): Promise<void> {
  // Parse message
  const message: OrderMessage = JSON.parse(record.body);
  const attributes = record.messageAttributes;

  // Validate message
  if (!message.order_id) {
    throw new Error('Missing order_id');
  }

  console.log('Processing order:', message.order_id);
  console.log('Priority:', attributes?.Priority?.stringValue);

  // Process based on message type
  await processOrder(message);

  // Publish success event
  await publishOrderProcessedEvent(message.order_id);
}

/**
 * Process order and save to DynamoDB
 */
async function processOrder(message: OrderMessage): Promise<void> {
  const tableName = process.env.ORDERS_TABLE || 'orders';

  await dynamodb.send(
    new PutItemCommand({
      TableName: tableName,
      Item: {
        order_id: { S: message.order_id },
        customer: { S: message.customer },
        total: { N: message.total.toString() },
        status: { S: 'processing' },
        timestamp: { S: new Date().toISOString() },
      },
    })
  );

  console.log('Order saved to DynamoDB:', message.order_id);
}

/**
 * Publish order processed event to SNS
 */
async function publishOrderProcessedEvent(orderId: string): Promise<void> {
  const topicArn = process.env.EVENTS_TOPIC_ARN;
  if (!topicArn) return;

  await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify({
        event_type: 'order.processed',
        order_id: orderId,
        timestamp: new Date().toISOString(),
      }),
      MessageAttributes: {
        event_type: {
          DataType: 'String',
          StringValue: 'order.processed',
        },
      },
    })
  );
}

/**
 * Handler for SNS events
 */
export async function snsHandler(event: any, context: Context): Promise<void> {
  console.log('SNS handler:', context.functionName);

  for (const record of event.Records) {
    const snsMessage = record.Sns;
    const message = JSON.parse(snsMessage.Message);
    const attributes = snsMessage.MessageAttributes;

    console.log('Event type:', attributes?.event_type?.Value);
    console.log('Message:', message);

    // Process based on event type
    await handleSnsMessage(message, attributes?.event_type?.Value);
  }
}

/**
 * Handle SNS notification
 */
async function handleSnsMessage(
  message: any,
  eventType: string
): Promise<void> {
  switch (eventType) {
    case 'order.created':
      await sendOrderConfirmation(message);
      break;
    case 'order.shipped':
      await sendShippingNotification(message);
      break;
    default:
      console.log('Unknown event type:', eventType);
  }
}

async function sendOrderConfirmation(message: any): Promise<void> {
  console.log('Sending confirmation for order:', message.order_id);
  // Implementation here
}

async function sendShippingNotification(message: any): Promise<void> {
  console.log('Sending shipping notification for:', message.order_id);
  // Implementation here
}
