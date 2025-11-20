// peek_example.ts
import { QueueClient, PeekedMessageItem } from "@azure/storage-queue";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

/**
 * Peek at messages without making them invisible
 */
async function peekMessages(
  queueName: string,
  maxMessages: number = 5
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  console.log(`Peeking at messages in '${queueName}'...`);

  // Peek doesn't change message visibility
  const response = await queueClient.peekMessages({
    numberOfMessages: maxMessages,
  });

  response.peekedMessageItems.forEach((message: PeekedMessageItem, index: number) => {
    console.log(`\n--- Peeked Message ${index + 1} ---`);
    console.log(`Message ID: ${message.messageId}`);
    console.log(`Insertion Time: ${message.insertedOn}`);
    console.log(`Expiration Time: ${message.expiresOn}`);
    console.log(`Dequeue Count: ${message.dequeueCount}`);
    console.log(`Content: ${message.messageText}`);
  });
}

/**
 * Get queue metadata and properties
 */
async function getQueueProperties(queueName: string): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  const properties = await queueClient.getProperties();

  console.log(`\n=== Queue Properties: ${queueName} ===`);
  console.log(`Approximate message count: ${properties.approximateMessagesCount}`);

  // Get metadata if any
  if (properties.metadata) {
    console.log("Metadata:");
    for (const [key, value] of Object.entries(properties.metadata)) {
      console.log(`  ${key}: ${value}`);
    }
  }
}

/**
 * Set custom metadata on queue
 */
async function setQueueMetadata(queueName: string): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  // Set metadata
  const metadata = {
    purpose: "image-processing",
    environment: "production",
    owner: "data-team",
  };

  await queueClient.setMetadata(metadata);
  console.log(`Metadata set on queue '${queueName}'`);

  // Verify
  const properties = await queueClient.getProperties();
  console.log("Current metadata:");
  if (properties.metadata) {
    for (const [key, value] of Object.entries(properties.metadata)) {
      console.log(`  ${key}: ${value}`);
    }
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const queueName = "tasks";

  // Peek at messages
  await peekMessages(queueName);

  // Get properties
  await getQueueProperties(queueName);

  // Set metadata
  await setQueueMetadata(queueName);
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log("\nPeek examples completed"))
    .catch((error) => {
      console.error("Peek examples failed:", error);
      process.exit(1);
    });
}

export { peekMessages, getQueueProperties, setQueueMetadata };
