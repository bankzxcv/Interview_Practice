// consumer.ts
import {
  QueueClient,
  DequeuedMessageItem,
  QueueReceiveMessageOptions,
} from "@azure/storage-queue";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

/**
 * Interface for task data
 */
interface TaskData {
  task?: string;
  [key: string]: unknown;
}

/**
 * Receive messages from queue
 */
async function receiveMessages(
  queueName: string,
  maxMessages: number = 1
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  console.log(`Receiving messages from '${queueName}'...`);

  const options: QueueReceiveMessageOptions = {
    numberOfMessages: maxMessages,
    visibilityTimeout: 30, // Message invisible for 30 seconds
  };

  // Receive messages
  const response = await queueClient.receiveMessages(options);

  for (const message of response.receivedMessageItems) {
    console.log("\n--- Message Received ---");
    console.log(`Message ID: ${message.messageId}`);
    console.log(`Insertion Time: ${message.insertedOn}`);
    console.log(`Expiration Time: ${message.expiresOn}`);
    console.log(`Dequeue Count: ${message.dequeueCount}`);
    console.log(`Content: ${message.messageText}`);

    // Process message
    try {
      const data: TaskData = JSON.parse(message.messageText);
      await processMessage(data);

      // Delete message after successful processing
      await queueClient.deleteMessage(message.messageId, message.popReceipt);
      console.log("Message processed and deleted");
    } catch (error) {
      console.error(`Error processing message: ${error}`);
      // Message will become visible again after timeout
    }
  }
}

/**
 * Process message (simulate processing)
 */
async function processMessage(data: TaskData): Promise<void> {
  console.log(`Processing: ${data.task || "unknown"}`);
  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/**
 * Continuously poll for messages
 */
async function continuousConsumer(
  queueName: string,
  pollInterval: number = 5
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  console.log(`Starting continuous consumer for '${queueName}'`);
  console.log(`Poll interval: ${pollInterval} seconds`);
  console.log("Press Ctrl+C to stop\n");

  // Set up graceful shutdown
  let isRunning = true;
  process.on("SIGINT", () => {
    console.log("\nStopping consumer...");
    isRunning = false;
  });

  try {
    while (isRunning) {
      const response = await queueClient.receiveMessages({
        numberOfMessages: 5,
        visibilityTimeout: 60,
      });

      let messageCount = 0;

      for (const message of response.receivedMessageItems) {
        messageCount++;
        try {
          const data: TaskData = JSON.parse(message.messageText);
          console.log(`Processing: ${JSON.stringify(data)}`);
          await processMessage(data);
          await queueClient.deleteMessage(message.messageId, message.popReceipt);
        } catch (error) {
          console.error(`Error: ${error}`);
        }
      }

      if (messageCount === 0) {
        console.log("No messages, waiting...");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }
  } catch (error) {
    console.error("Consumer error:", error);
  }

  console.log("\nConsumer stopped");
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Receive single batch
  await receiveMessages("tasks", 5);

  // Or run continuous consumer (uncomment to use)
  // await continuousConsumer("tasks");
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

export { receiveMessages, continuousConsumer };
