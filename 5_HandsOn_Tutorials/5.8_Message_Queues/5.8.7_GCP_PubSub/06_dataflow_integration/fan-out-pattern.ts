// fan-out-pattern.ts
/**
 * Fan-Out Pattern: Deploy multiple Cloud Functions for different event types
 *
 * orders-topic → order-created-function
 *             → order-shipped-function
 *             → order-analytics-function
 */

import type { CloudFunction } from '@google-cloud/functions-framework';

interface EventMessage {
  event_type: string;
  order_id: string;
  [key: string]: any;
}

/**
 * Function specific to order created events
 */
export const handleOrderCreated: CloudFunction = async (message) => {
  const dataBuffer = Buffer.from(message.data, 'base64');
  const data: EventMessage = JSON.parse(dataBuffer.toString('utf-8'));

  if (data.event_type !== 'order.created') {
    return;  // Ignore other events
  }

  // Process order creation
  console.log(`Order created: ${data.order_id}`);
  // Send confirmation email, update inventory, etc.
};

/**
 * Function specific to order shipped events
 */
export const handleOrderShipped: CloudFunction = async (message) => {
  const dataBuffer = Buffer.from(message.data, 'base64');
  const data: EventMessage = JSON.parse(dataBuffer.toString('utf-8'));

  if (data.event_type !== 'order.shipped') {
    return;  // Ignore other events
  }

  // Send shipping notification
  console.log(`Order shipped: ${data.order_id}`);
  // Send tracking email, update status, etc.
};

/**
 * Deploy instructions:
 *
 * gcloud functions deploy order-created-handler \
 *   --runtime nodejs20 \
 *   --trigger-topic=orders-topic \
 *   --entry-point=handleOrderCreated
 *
 * gcloud functions deploy order-shipped-handler \
 *   --runtime nodejs20 \
 *   --trigger-topic=orders-topic \
 *   --entry-point=handleOrderShipped
 */
