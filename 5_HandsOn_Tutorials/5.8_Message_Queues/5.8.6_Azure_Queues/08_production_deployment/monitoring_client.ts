// monitoring_client.ts
import { ServiceBusClient, ServiceBusReceivedMessage } from "@azure/service-bus";
import { DefaultAzureCredential } from "@azure/identity";

const NAMESPACE_FQDN = process.env.SERVICEBUS_FQDN || "";
const QUEUE_NAME = process.env.QUEUE_NAME || "orders";

interface CustomDimensions {
  message_id?: string;
  delivery_count?: number;
  [key: string]: unknown;
}

/**
 * Process message with monitoring and logging
 * This example shows patterns for production monitoring
 */
async function processMessageWithMonitoring(
  message: ServiceBusReceivedMessage
): Promise<void> {
  const startTime = Date.now();

  // Log message processing start
  const dimensions: CustomDimensions = {
    message_id: message.messageId || undefined,
    delivery_count: message.deliveryCount,
  };

  console.log("Processing message", dimensions);

  try {
    // Process message
    await processMessage(message);

    // Log success
    const duration = Date.now() - startTime;
    console.log("Message processed successfully", {
      ...dimensions,
      duration_ms: duration,
    });
  } catch (error) {
    // Log failure
    const duration = Date.now() - startTime;
    console.error("Message processing failed", {
      ...dimensions,
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration,
    });
    throw error;
  }
}

async function processMessage(message: ServiceBusReceivedMessage): Promise<void> {
  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Example with custom metrics tracking
 */
class MetricsTracker {
  private messagesProcessed = 0;
  private processingTimes: number[] = [];

  trackProcessing(durationMs: number): void {
    this.messagesProcessed++;
    this.processingTimes.push(durationMs);
  }

  getAverageProcessingTime(): number {
    if (this.processingTimes.length === 0) return 0;
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    return sum / this.processingTimes.length;
  }

  getMetrics(): { count: number; avgTime: number } {
    return {
      count: this.messagesProcessed,
      avgTime: this.getAverageProcessingTime(),
    };
  }
}

async function processWithMetrics(): Promise<void> {
  const client = new ServiceBusClient(
    NAMESPACE_FQDN,
    new DefaultAzureCredential()
  );
  const receiver = client.createReceiver(QUEUE_NAME);
  const metrics = new MetricsTracker();

  try {
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    for (const message of messages) {
      const startTime = Date.now();

      try {
        await processMessage(message);
        await receiver.completeMessage(message);

        const duration = Date.now() - startTime;
        metrics.trackProcessing(duration);
      } catch (error) {
        await receiver.abandonMessage(message);
      }
    }

    console.log("Processing metrics:", metrics.getMetrics());
  } finally {
    await receiver.close();
    await client.close();
  }
}

if (require.main === module) {
  processWithMetrics().catch(console.error);
}

export { processMessageWithMonitoring, MetricsTracker };
