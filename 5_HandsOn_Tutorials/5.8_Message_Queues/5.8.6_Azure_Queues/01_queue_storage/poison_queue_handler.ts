// poison_queue_handler.ts
import { QueueClient } from "@azure/storage-queue";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

/**
 * Maximum dequeue count before moving to poison queue
 */
const MAX_DEQUEUE_COUNT = 3;

/**
 * Interface for poison message data
 */
interface PoisonMessageData {
  original_message: string;
  message_id: string;
  dequeue_count: number;
  error: string;
}

/**
 * Interface for task data
 */
interface TaskData {
  task?: string;
  [key: string]: unknown;
}

/**
 * Process messages with poison queue for failures
 */
async function processWithPoisonQueue(
  queueName: string,
  poisonQueueName: string = "poison-messages"
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);
  const poisonQueueClient = new QueueClient(CONNECTION_STRING, poisonQueueName);

  // Ensure poison queue exists
  await poisonQueueClient.createIfNotExists();

  const response = await queueClient.receiveMessages({
    numberOfMessages: 10,
    visibilityTimeout: 60,
  });

  for (const message of response.receivedMessageItems) {
    // Check dequeue count
    if (message.dequeueCount >= MAX_DEQUEUE_COUNT) {
      console.log(
        `Message ${message.messageId} exceeded max retries, moving to poison queue`
      );

      // Move to poison queue
      const poisonData: PoisonMessageData = {
        original_message: message.messageText,
        message_id: message.messageId,
        dequeue_count: message.dequeueCount,
        error: "Exceeded max retry count",
      };

      await poisonQueueClient.sendMessage(JSON.stringify(poisonData));

      // Delete from main queue
      await queueClient.deleteMessage(message.messageId, message.popReceipt);
      continue;
    }

    // Try to process
    try {
      const data: TaskData = JSON.parse(message.messageText);
      await processTask(data);

      // Success - delete message
      await queueClient.deleteMessage(message.messageId, message.popReceipt);
      console.log(`Successfully processed message ${message.messageId}`);
    } catch (error) {
      console.error(`Error processing message ${message.messageId}: ${error}`);
      // Message will reappear after visibility timeout
      // Dequeue count will increment
    }
  }
}

/**
 * Simulate task processing that might fail
 */
async function processTask(data: TaskData): Promise<void> {
  const taskType = data.task;

  // Simulate failure for specific task types
  if (taskType === "failing_task") {
    throw new Error("Task processing failed");
  }

  console.log(`Processing task: ${taskType}`);
}

/**
 * Review and handle poison messages
 */
async function reviewPoisonQueue(
  poisonQueueName: string = "poison-messages"
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, poisonQueueName);

  console.log("\n=== Poison Queue Review ===");

  const response = await queueClient.peekMessages({ numberOfMessages: 32 });

  for (const message of response.peekedMessageItems) {
    const data: PoisonMessageData = JSON.parse(message.messageText);
    console.log(`\nPoison Message ID: ${message.messageId}`);
    console.log(`Original content: ${data.original_message}`);
    console.log(`Dequeue count: ${data.dequeue_count}`);
    console.log(`Error: ${data.error}`);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  await processWithPoisonQueue("tasks");
  await reviewPoisonQueue();
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log("\nPoison queue handler completed"))
    .catch((error) => {
      console.error("Poison queue handler failed:", error);
      process.exit(1);
    });
}

export { processWithPoisonQueue, reviewPoisonQueue };
