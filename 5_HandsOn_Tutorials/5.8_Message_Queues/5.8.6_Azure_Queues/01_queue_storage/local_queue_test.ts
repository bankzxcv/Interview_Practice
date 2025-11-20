// local_queue_test.ts
import { QueueClient } from "@azure/storage-queue";

/**
 * Azurite connection string for local development
 * Default connection string for Azurite queue emulator
 */
const AZURITE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=http;" +
  "AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;" +
  "QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;";

/**
 * Interface for message data
 */
interface TaskMessage {
  task: string;
  image_id: string;
  timestamp: string;
}

/**
 * Create a queue client for Azurite
 */
function createQueueClient(queueName: string): QueueClient {
  return new QueueClient(AZURITE_CONNECTION_STRING, queueName);
}

/**
 * Test basic queue operations with Azurite
 */
async function testQueueOperations(): Promise<void> {
  const queueName = "test-queue";
  const queueClient = createQueueClient(queueName);

  try {
    // Create queue
    console.log(`Creating queue: ${queueName}`);
    await queueClient.create();

    // Send message
    const message: TaskMessage = {
      task: "process_image",
      image_id: "12345",
      timestamp: new Date().toISOString(),
    };

    console.log(`Sending message:`, message);
    await queueClient.sendMessage(JSON.stringify(message));

    // Receive message
    console.log("Receiving messages...");
    const receivedMessages = await queueClient.receiveMessages({
      numberOfMessages: 1,
    });

    for (const msg of receivedMessages.receivedMessageItems) {
      console.log(`Message ID: ${msg.messageId}`);
      console.log(`Content: ${msg.messageText}`);
      console.log(`Dequeue count: ${msg.dequeueCount}`);

      // Delete message after processing
      await queueClient.deleteMessage(msg.messageId, msg.popReceipt);
      console.log("Message deleted");
    }

    // Clean up
    await queueClient.delete();
    console.log("Queue deleted");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  testQueueOperations()
    .then(() => console.log("Test completed successfully"))
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}

export { createQueueClient, testQueueOperations };
