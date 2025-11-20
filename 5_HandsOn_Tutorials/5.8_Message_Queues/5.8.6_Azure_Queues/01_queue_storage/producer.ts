// producer.ts
import { QueueClient, QueueSendMessageResponse } from "@azure/storage-queue";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

/**
 * Interface for message data
 */
interface MessageData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Interface for image resize task
 */
interface ImageResizeTask {
  task: string;
  image_url: string;
  width: number;
  height: number;
}

/**
 * Interface for generic task
 */
interface GenericTask {
  id: number;
  task: string;
  data: string;
  timestamp: string;
}

/**
 * Send a message to the queue
 */
async function sendMessage(
  queueName: string,
  messageData: MessageData
): Promise<QueueSendMessageResponse> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  // Ensure queue exists
  await queueClient.createIfNotExists();

  // Send message
  const message = JSON.stringify(messageData);
  const response = await queueClient.sendMessage(message);

  console.log("Message sent:");
  console.log(`  Message ID: ${response.messageId}`);
  console.log(`  Insertion time: ${response.insertedOn}`);
  console.log(`  Expiration time: ${response.expiresOn}`);

  return response;
}

/**
 * Send multiple messages
 */
async function sendMultipleMessages(
  queueName: string,
  count: number = 10
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  await queueClient.createIfNotExists();

  for (let i = 0; i < count; i++) {
    const message: GenericTask = {
      id: i,
      task: "process_data",
      data: `item_${i}`,
      timestamp: new Date().toISOString(),
    };

    await queueClient.sendMessage(JSON.stringify(message));
    console.log(`Sent message ${i + 1}/${count}`);
  }

  console.log(`\nSent ${count} messages to queue '${queueName}'`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Send single message
  const imageTask: ImageResizeTask = {
    task: "resize_image",
    image_url: "https://example.com/image.jpg",
    width: 800,
    height: 600,
  };

  await sendMessage("tasks", imageTask);

  // Send multiple messages
  await sendMultipleMessages("tasks", 10);
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

export { sendMessage, sendMultipleMessages };
