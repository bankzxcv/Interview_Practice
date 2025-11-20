// session_producer.ts
import { ServiceBusClient, ServiceBusMessage } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders-with-sessions";

interface Order {
  order_id: string;
  amount: number;
}

/**
 * Send messages with session ID (orders for same customer)
 */
async function sendSessionMessages(
  customerId: string,
  orders: Order[]
): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender = sbClient.createSender(QUEUE_NAME);

  try {
    for (const order of orders) {
      const message: ServiceBusMessage = {
        body: order,
        sessionId: customerId, // Messages with same sessionId are FIFO
      };

      await sender.sendMessages(message);
      console.log(`Sent order ${order.order_id} for session ${customerId}`);
    }
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

async function main(): Promise<void> {
  // All messages for customer-1 will be processed in order
  const customer1Orders: Order[] = [
    { order_id: "ORD-001", amount: 100 },
    { order_id: "ORD-002", amount: 200 },
    { order_id: "ORD-003", amount: 150 },
  ];
  await sendSessionMessages("customer-1", customer1Orders);

  // Messages for customer-2 can be processed in parallel
  const customer2Orders: Order[] = [
    { order_id: "ORD-004", amount: 300 },
    { order_id: "ORD-005", amount: 250 },
  ];
  await sendSessionMessages("customer-2", customer2Orders);
}

if (require.main === module) {
  main().catch(console.error);
}

export { sendSessionMessages };
