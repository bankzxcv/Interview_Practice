// QueueTrigger/index.ts
import { AzureFunction, Context } from "@azure/functions";

interface OrderMessage {
  order_id: string;
  customer_id: string;
  amount: number;
  items: string[];
}

/**
 * Azure Function triggered by Queue Storage
 * Automatically processes messages from Azure Queue Storage
 */
const queueTrigger: AzureFunction = async function (
  context: Context,
  message: string
): Promise<void> {
  context.log("Queue trigger function processed a message");
  context.log("Message body:", message);

  try {
    // Parse JSON message
    const orderData: OrderMessage = JSON.parse(message);

    // Process order
    await processOrder(context, orderData);

    context.log("Message processed successfully");
  } catch (error) {
    context.log.error("Processing error:", error);
    // Throwing error will cause message to be retried
    // After max retries, goes to poison queue
    throw error;
  }
};

async function processOrder(
  context: Context,
  orderData: OrderMessage
): Promise<void> {
  context.log(`Processing order ${orderData.order_id}`);
  context.log(`Customer: ${orderData.customer_id}`);
  context.log(`Amount: $${orderData.amount}`);

  // Business logic here
  // - Update database
  // - Call external API
  // - Send notification
}

export default queueTrigger;
