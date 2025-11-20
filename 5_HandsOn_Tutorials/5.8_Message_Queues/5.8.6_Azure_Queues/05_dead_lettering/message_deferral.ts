// message_deferral.ts
import { ServiceBusClient, ServiceBusMessage } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders";

interface Order {
  order_id: string;
  depends_on: string | null;
}

/**
 * Send orders with dependencies
 */
async function sendOrdersWithDependencies(): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender = sbClient.createSender(QUEUE_NAME);

  const orders: Order[] = [
    { order_id: "ORD-001", depends_on: null },
    { order_id: "ORD-002", depends_on: "ORD-001" }, // Must wait
    { order_id: "ORD-003", depends_on: null },
    { order_id: "ORD-004", depends_on: "ORD-002" }, // Must wait
  ];

  try {
    for (const order of orders) {
      const message: ServiceBusMessage = { body: order };
      await sender.sendMessages(message);
      console.log(`Sent: ${order.order_id}`);
    }
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

/**
 * Process orders, deferring those with unmet dependencies
 */
async function processWithDeferral(): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver = sbClient.createReceiver(QUEUE_NAME);

  const processedOrders = new Set<string>();
  const deferredSequenceNumbers: bigint[] = [];

  try {
    // First pass
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    for (const message of messages) {
      const body = message.body as Order;
      const dependsOn = body.depends_on;

      // Check if dependency is met
      if (dependsOn && !processedOrders.has(dependsOn)) {
        console.log(`Deferring ${body.order_id} (waiting for ${dependsOn})`);
        await receiver.deferMessage(message);
        deferredSequenceNumbers.push(message.sequenceNumber!);
      } else {
        console.log(`Processing ${body.order_id}`);
        processedOrders.add(body.order_id);
        await receiver.completeMessage(message);
      }
    }

    // Process deferred messages
    if (deferredSequenceNumbers.length > 0) {
      console.log("\nProcessing deferred messages...");
      const deferredMessages = await receiver.receiveDeferredMessages(
        deferredSequenceNumbers
      );

      for (const message of deferredMessages) {
        const body = message.body as Order;
        console.log(`Processing deferred: ${body.order_id}`);
        processedOrders.add(body.order_id);
        await receiver.completeMessage(message);
      }
    }
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

if (require.main === module) {
  sendOrdersWithDependencies()
    .then(() => new Promise((resolve) => setTimeout(resolve, 1000)))
    .then(() => processWithDeferral())
    .catch(console.error);
}

export { sendOrdersWithDependencies, processWithDeferral };
