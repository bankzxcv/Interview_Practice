// subscriber.ts
import { ServiceBusClient, ServiceBusReceivedMessage } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const TOPIC_NAME = "events";

/**
 * Subscribe to all events
 */
async function subscribeAllEvents(subscriptionName: string = "all-events"): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver = sbClient.createReceiver(TOPIC_NAME, subscriptionName);

  console.log(`Subscribing to: ${subscriptionName}`);
  console.log("Will receive ALL messages\n");

  try {
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    for (const message of messages) {
      console.log("\n--- Message Received ---");
      console.log(`Message ID: ${message.messageId}`);

      const props = message.applicationProperties;
      console.log(`Event Type: ${props?.event_type}`);
      console.log(`Priority: ${props?.priority}`);
      console.log(`Timestamp: ${props?.timestamp}`);
      console.log(`Data: ${JSON.stringify(message.body, null, 2)}`);

      await receiver.completeMessage(message);
    }
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

/**
 * Subscribe to high priority messages only
 */
async function subscribeHighPriority(subscriptionName: string = "high-priority"): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver = sbClient.createReceiver(TOPIC_NAME, subscriptionName);

  console.log(`Subscribing to: ${subscriptionName}`);
  console.log("Will receive only HIGH PRIORITY messages\n");

  try {
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    for (const message of messages) {
      const props = message.applicationProperties;
      console.log(`\n🔴 HIGH PRIORITY: ${props?.event_type}`);
      console.log(`Data: ${JSON.stringify(message.body, null, 2)}`);

      // Handle high priority message
      await handleHighPriority(message.body, props);
      await receiver.completeMessage(message);
    }
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

async function handleHighPriority(data: unknown, props: unknown): Promise<void> {
  console.log("⚡ Processing with high priority...");
  // Send alert, escalate, etc.
}

if (require.main === module) {
  subscribeAllEvents().catch(console.error);
}

export { subscribeAllEvents, subscribeHighPriority };
