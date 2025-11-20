// publisher.ts
import { ServiceBusClient, ServiceBusMessage } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const TOPIC_NAME = "events";

interface EventData {
  [key: string]: unknown;
}

/**
 * Publish a message to the topic
 */
async function publishMessage(
  eventType: string,
  data: EventData,
  priority: string = "normal"
): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender = sbClient.createSender(TOPIC_NAME);

  try {
    const message: ServiceBusMessage = {
      body: data,
      contentType: "application/json",
      messageId: `${eventType}-${Date.now()}`,
      applicationProperties: {
        event_type: eventType,
        priority: priority,
        timestamp: new Date().toISOString(),
        source: "api-service",
      },
    };

    await sender.sendMessages(message);
    console.log(`Published: ${eventType} (priority: ${priority})`);
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

/**
 * Publish multiple events in a batch
 */
async function publishBatch(
  events: Array<{ type: string; data: EventData; priority?: string }>
): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender = sbClient.createSender(TOPIC_NAME);

  try {
    let batch = await sender.createMessageBatch();

    for (const event of events) {
      const message: ServiceBusMessage = {
        body: event.data,
        applicationProperties: {
          event_type: event.type,
          priority: event.priority || "normal",
        },
      };

      if (!batch.tryAddMessage(message)) {
        await sender.sendMessages(batch);
        console.log("Sent batch of messages");
        batch = await sender.createMessageBatch();
        batch.tryAddMessage(message);
      }
    }

    if (batch.count > 0) {
      await sender.sendMessages(batch);
      console.log("Sent final batch");
    }
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

async function main(): Promise<void> {
  // Publish different types of events
  await publishMessage("order.created", {
    order_id: "ORD-001",
    customer_id: "CUST-123",
    amount: 99.99,
  }, "normal");

  await publishMessage("order.updated", {
    order_id: "ORD-001",
    status: "shipped",
  }, "high");

  await publishMessage("alert.critical", {
    message: "System error detected",
    severity: "critical",
  }, "high");
}

if (require.main === module) {
  main().catch(console.error);
}

export { publishMessage, publishBatch };
