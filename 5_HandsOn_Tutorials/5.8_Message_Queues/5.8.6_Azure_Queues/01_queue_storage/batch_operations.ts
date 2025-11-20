// batch_operations.ts
import { QueueClient } from "@azure/storage-queue";

/**
 * Get connection string from environment
 */
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

/**
 * Interface for batch message
 */
interface BatchMessage {
  id: number;
  task: string;
  data: string;
}

/**
 * Send messages in batches
 */
async function batchSend(
  queueName: string,
  messagesCount: number = 100
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  await queueClient.createIfNotExists();

  const startTime = Date.now();

  for (let i = 0; i < messagesCount; i++) {
    const message: BatchMessage = {
      id: i,
      task: "batch_process",
      data: `item_${i}`,
    };

    await queueClient.sendMessage(JSON.stringify(message));
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`Sent ${messagesCount} messages in ${elapsed.toFixed(2)} seconds`);
  console.log(`Rate: ${(messagesCount / elapsed).toFixed(2)} msg/sec`);
}

/**
 * Receive and process messages in batches
 */
async function batchReceive(
  queueName: string,
  batchSize: number = 32
): Promise<void> {
  const queueClient = new QueueClient(CONNECTION_STRING, queueName);

  let totalProcessed = 0;
  const startTime = Date.now();

  while (true) {
    const response = await queueClient.receiveMessages({
      numberOfMessages: batchSize,
      visibilityTimeout: 60,
    });

    let batchCount = 0;

    for (const message of response.receivedMessageItems) {
      // Process message
      const data: BatchMessage = JSON.parse(message.messageText);
      // Simulate processing

      // Delete message
      await queueClient.deleteMessage(message.messageId, message.popReceipt);
      batchCount++;
      totalProcessed++;
    }

    if (batchCount === 0) {
      break;
    }

    console.log(`Processed batch of ${batchCount} messages`);
  }

  const elapsed = (Date.now() - startTime) / 1000;
  if (totalProcessed > 0) {
    console.log(
      `\nProcessed ${totalProcessed} messages in ${elapsed.toFixed(2)} seconds`
    );
    console.log(`Rate: ${(totalProcessed / elapsed).toFixed(2)} msg/sec`);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const queueName = "batch-test";

  // Send batch
  await batchSend(queueName, 100);

  // Receive batch
  await batchReceive(queueName, 32);
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log("\nBatch operations completed"))
    .catch((error) => {
      console.error("Batch operations failed:", error);
      process.exit(1);
    });
}

export { batchSend, batchReceive };
