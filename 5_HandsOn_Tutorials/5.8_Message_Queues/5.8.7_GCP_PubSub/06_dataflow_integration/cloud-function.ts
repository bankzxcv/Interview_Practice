// cloud-function.ts
/**
 * Cloud Function triggered by Pub/Sub
 * This would be deployed to Google Cloud Functions
 *
 * Deploy with:
 * gcloud functions deploy processPubSubMessage \
 *   --runtime nodejs20 \
 *   --trigger-topic=orders-topic \
 *   --entry-point=processPubSubMessage
 */

import type { CloudFunction } from '@google-cloud/functions-framework';

interface PubSubMessage {
  data: string;
  attributes?: { [key: string]: string };
  messageId: string;
  publishTime: string;
}

interface OrderData {
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
}

/**
 * Cloud Function triggered by Pub/Sub
 */
export const processPubSubMessage: CloudFunction = async (message: PubSubMessage) => {
  // Get Pub/Sub message
  const dataBuffer = Buffer.from(message.data, 'base64');
  const dataString = dataBuffer.toString('utf-8');

  try {
    // Parse message
    const messageData: OrderData = JSON.parse(dataString);
    console.log('Processing message:', messageData);

    // Your business logic here
    const result = await processOrder(messageData);

    console.log('Processing complete:', result);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      console.error('Invalid JSON:', error);
      // Cloud Function will retry on error
      throw error;
    }

    console.error('Processing error:', error);
    throw error;
  }
};

async function processOrder(orderData: OrderData): Promise<Record<string, any>> {
  const { order_id, amount } = orderData;

  // Example: Update database, send notification, etc.
  console.log(`Processing order ${order_id} for $${amount}`);

  return {
    order_id,
    status: 'processed',
    amount,
  };
}
