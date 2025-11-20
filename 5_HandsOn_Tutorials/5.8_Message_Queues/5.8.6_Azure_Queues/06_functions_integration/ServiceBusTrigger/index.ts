// ServiceBusTrigger/index.ts
import { AzureFunction, Context } from "@azure/functions";

interface ServiceBusMessageContext {
  messageId: string;
  contentType: string;
  deliveryCount: number;
  enqueuedTimeUtc: Date;
  sessionId?: string;
  userProperties?: Record<string, unknown>;
}

/**
 * Azure Function triggered by Service Bus Queue
 * Supports sessions, dead lettering, and auto-complete
 */
const serviceBusTrigger: AzureFunction = async function (
  context: Context,
  message: unknown
): Promise<void> {
  context.log("Service Bus Queue trigger function processed a message");

  // Get message properties from binding data
  const messageId = context.bindingData.messageId as string;
  const contentType = context.bindingData.contentType as string;
  const deliveryCount = context.bindingData.deliveryCount as number;
  const userProperties = context.bindingData.userProperties as Record<
    string,
    unknown
  >;
  const sessionId = context.bindingData.sessionId as string | undefined;

  context.log("Message ID:", messageId);
  context.log("Content Type:", contentType);
  context.log("Delivery Count:", deliveryCount);

  if (userProperties) {
    context.log("User Properties:", userProperties);
  }

  if (sessionId) {
    context.log("Session ID:", sessionId);
  }

  try {
    // Process message
    await processMessage(context, message);
    // Message auto-completes on success
  } catch (error) {
    context.log.error("Error processing message:", error);
    // Message will be retried (abandoned)
    // After max delivery count, moves to dead letter queue
    throw error;
  }
};

async function processMessage(context: Context, data: unknown): Promise<void> {
  context.log("Processing:", data);
  // Business logic here
}

export default serviceBusTrigger;
