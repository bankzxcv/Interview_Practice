// ttl_example.ts
import { QueueClient, QueueSendMessageOptions } from "@azure/storage-queue";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

/**
 * Send message with custom TTL
 */
async function sendWithTtl(
  queueName: string,
  message: string,
  ttlSeconds: number = 60
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  await queueClient.createIfNotExists();

  // Send message with TTL
  const options: QueueSendMessageOptions = {
    messageTimeToLive: ttlSeconds, // Message expires after this time
  };

  const response = await queueClient.sendMessage(message, options);

  console.log(`Message sent with ${ttlSeconds}s TTL`);
  console.log(`Expiration time: ${response.expiresOn}`);
}

/**
 * Send message with initial visibility timeout
 */
async function sendWithVisibilityTimeout(
  queueName: string,
  message: string,
  visibilityTimeout: number = 10
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  await queueClient.createIfNotExists();

  // Send message with visibility timeout
  const options: QueueSendMessageOptions = {
    visibilityTimeout: visibilityTimeout, // Message invisible initially
  };

  const response = await queueClient.sendMessage(message, options);

  console.log(`Message sent, invisible for ${visibilityTimeout}s`);
  console.log(`Message ID: ${response.messageId}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Message expires after 60 seconds
  await sendWithTtl("tasks", "Short-lived task", 60);

  // Message invisible for 10 seconds after sending
  await sendWithVisibilityTimeout("tasks", "Delayed task", 10);
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log("\nTTL examples completed"))
    .catch((error) => {
      console.error("TTL examples failed:", error);
      process.exit(1);
    });
}

export { sendWithTtl, sendWithVisibilityTimeout };
