// visibility_update.ts
import { QueueClient } from "@azure/storage-queue";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

/**
 * Extend message visibility while processing
 */
async function extendProcessingTime(queueName: string): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  const response = await queueClient.receiveMessages({
    numberOfMessages: 1,
    visibilityTimeout: 30,
  });

  for (const message of response.receivedMessageItems) {
    console.log(`Processing message: ${message.messageId}`);

    // Start long-running task
    for (let i = 0; i < 5; i++) {
      console.log(`  Step ${i + 1}/5...`);
      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Extend visibility timeout
      const updated = await queueClient.updateMessage(
        message.messageId,
        message.popReceipt,
        undefined, // Don't change message content
        30 // Extend for another 30 seconds
      );

      console.log(`  Visibility extended until: ${updated.nextVisibleOn}`);
    }

    // Complete processing and delete
    await queueClient.deleteMessage(message.messageId, message.popReceipt);
    console.log("Message completed and deleted");
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  await extendProcessingTime("tasks");
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log("\nVisibility update completed"))
    .catch((error) => {
      console.error("Visibility update failed:", error);
      process.exit(1);
    });
}

export { extendProcessingTime };
