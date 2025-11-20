// consumer.ts
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusReceivedMessage,
} from "@azure/service-bus";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders";

/**
 * Process order data
 */
async function processOrder(orderData: Record<string, unknown>): Promise<void> {
  console.log(`Processing order: ${orderData.order_id || "unknown"}`);
  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Receive messages using Peek-Lock mode
 */
async function receiveMessages(maxMessages: number = 10): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver: ServiceBusReceiver = sbClient.createReceiver(QUEUE_NAME);

  try {
    // Receive messages (peek-lock mode by default)
    const messages = await receiver.receiveMessages(maxMessages, {
      maxWaitTimeInMs: 5000,
    });

    for (const message of messages) {
      console.log("\n--- Message Received ---");
      console.log(`Message ID: ${message.messageId}`);
      console.log(`Sequence #: ${message.sequenceNumber}`);
      console.log(`Enqueued Time: ${message.enqueuedTimeUtc}`);
      console.log(`Delivery Count: ${message.deliveryCount}`);
      console.log(`Content Type: ${message.contentType}`);
      console.log(`Body: ${JSON.stringify(message.body)}`);

      // Custom properties
      if (message.applicationProperties) {
        console.log("Properties:");
        for (const [key, value] of Object.entries(message.applicationProperties)) {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Process message
      try {
        await processOrder(message.body);

        // Complete (delete) message
        await receiver.completeMessage(message);
        console.log("✓ Message completed");
      } catch (error) {
        console.error(`✗ Error processing: ${error}`);

        // Abandon message (returns to queue)
        await receiver.abandonMessage(message);
        console.log("Message abandoned, will be retried");
      }
    }
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

/**
 * Receive messages and defer some for later processing
 */
async function receiveAndDefer(maxMessages: number = 5): Promise<bigint[]> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver = sbClient.createReceiver(QUEUE_NAME);

  const deferredSequenceNumbers: bigint[] = [];

  try {
    const messages = await receiver.receiveMessages(maxMessages, {
      maxWaitTimeInMs: 5000,
    });

    for (const message of messages) {
      const body = message.body as Record<string, unknown>;

      // Defer messages that need prerequisite processing
      if (body.requires_preprocessing) {
        console.log(`Deferring message ${message.sequenceNumber}`);
        await receiver.deferMessage(message);
        deferredSequenceNumbers.push(message.sequenceNumber!);
      } else {
        await processOrder(body);
        await receiver.completeMessage(message);
      }
    }

    return deferredSequenceNumbers;
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

/**
 * Receive previously deferred messages
 */
async function receiveDeferredMessages(sequenceNumbers: bigint[]): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver = sbClient.createReceiver(QUEUE_NAME);

  try {
    // Receive deferred messages by sequence number
    const messages = await receiver.receiveDeferredMessages(sequenceNumbers);

    for (const message of messages) {
      console.log(`Processing deferred message: ${message.sequenceNumber}`);
      await processOrder(message.body);
      await receiver.completeMessage(message);
    }
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

/**
 * Continuously receive messages
 */
async function continuousReceiver(): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver = sbClient.createReceiver(QUEUE_NAME);

  console.log("Starting continuous receiver (Ctrl+C to stop)...");

  // Set up message handler
  const messageHandler = async (message: ServiceBusReceivedMessage) => {
    try {
      console.log(`Processing: ${JSON.stringify(message.body)}`);
      await processOrder(message.body);
      await receiver.completeMessage(message);
    } catch (error) {
      console.error(`Error: ${error}`);
      await receiver.abandonMessage(message);
    }
  };

  // Set up error handler
  const errorHandler = async (error: Error) => {
    console.error("Error in receiver:", error);
  };

  // Subscribe to messages
  receiver.subscribe({
    processMessage: messageHandler,
    processError: errorHandler,
  });

  // Keep process running
  await new Promise(() => {});
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Receive batch of messages
  await receiveMessages(10);

  // Or run continuous receiver (uncomment to use)
  // await continuousReceiver();
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log("\nConsumer completed"))
    .catch((error) => {
      console.error("Consumer failed:", error);
      process.exit(1);
    });
}

export { receiveMessages, receiveAndDefer, receiveDeferredMessages, continuousReceiver };
