// producer.ts
import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusSender,
} from "@azure/service-bus";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders";

/**
 * Interface for order data
 */
interface OrderData {
  order_id: string;
  customer_id: string;
  total: number;
  items: string[];
}

/**
 * Send a single message to queue
 */
async function sendSingleMessage(messageData: Record<string, unknown>): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender: ServiceBusSender = sbClient.createSender(QUEUE_NAME);

  try {
    // Create message
    const message: ServiceBusMessage = {
      body: messageData,
      contentType: "application/json",
      messageId: `msg-${Date.now()}`,
      timeToLive: 3600 * 1000, // 1 hour TTL (in milliseconds)
      applicationProperties: {
        order_type: "standard",
        priority: "normal",
        timestamp: new Date().toISOString(),
      },
    };

    // Send message
    await sender.sendMessages(message);
    console.log(`Sent message: ${message.messageId}`);
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

/**
 * Send multiple messages in a batch
 */
async function sendBatchMessages(messagesData: Record<string, unknown>[]): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender = sbClient.createSender(QUEUE_NAME);

  try {
    // Create batch
    let batch = await sender.createMessageBatch();

    for (const data of messagesData) {
      const message: ServiceBusMessage = {
        body: data,
        messageId: (data.id as string) || "unknown",
      };

      // Try to add message to batch
      if (!batch.tryAddMessage(message)) {
        // Batch is full, send it and create new batch
        await sender.sendMessages(batch);
        console.log("Sent batch of messages");
        batch = await sender.createMessageBatch();

        // Add message to new batch
        if (!batch.tryAddMessage(message)) {
          throw new Error("Message too large to fit in batch");
        }
      }
    }

    // Send remaining messages
    if (batch.count > 0) {
      await sender.sendMessages(batch);
      console.log(`Sent final batch of ${batch.count} messages`);
    }
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

/**
 * Send a message scheduled for future delivery
 */
async function sendScheduledMessage(
  messageData: Record<string, unknown>,
  delaySeconds: number = 60
): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender = sbClient.createSender(QUEUE_NAME);

  try {
    // Schedule message for future
    const scheduledTime = new Date(Date.now() + delaySeconds * 1000);

    const message: ServiceBusMessage = {
      body: messageData,
      scheduledEnqueueTimeUtc: scheduledTime,
    };

    // Returns sequence number
    const sequenceNumber = await sender.scheduleMessages([message], scheduledTime);
    console.log(`Scheduled message for ${scheduledTime}`);
    console.log(`Sequence number: ${sequenceNumber[0]}`);
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Send single message
  const order: OrderData = {
    order_id: "ORD-001",
    customer_id: "CUST-123",
    total: 99.99,
    items: ["item1", "item2"],
  };
  await sendSingleMessage(order);

  // Send batch
  const orders = Array.from({ length: 10 }, (_, i) => ({
    id: `ORD-${String(i + 1).padStart(3, "0")}`,
    amount: (i + 1) * 10,
  }));
  await sendBatchMessages(orders);

  // Send scheduled message
  const reminder = { type: "reminder", message: "Process pending orders" };
  await sendScheduledMessage(reminder, 300); // 5 minutes
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log("\nProducer completed"))
    .catch((error) => {
      console.error("Producer failed:", error);
      process.exit(1);
    });
}

export { sendSingleMessage, sendBatchMessages, sendScheduledMessage };
