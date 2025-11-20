// session_producer.ts
import { ServiceBusClient, ServiceBusMessage } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders-per-customer";

interface Order {
  order_id: string;
  product: string;
  amount: number;
}

/**
 * Send orders for a specific customer (same session)
 */
async function sendCustomerOrders(
  customerId: string,
  orders: Order[]
): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const sender = sbClient.createSender(QUEUE_NAME);

  try {
    console.log(`\nSending orders for session: ${customerId}`);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const message: ServiceBusMessage = {
        body: order,
        sessionId: customerId, // All messages for this customer
        messageId: `${customerId}-${order.order_id}`,
        applicationProperties: {
          customer_id: customerId,
          order_sequence: i + 1,
          timestamp: new Date().toISOString(),
        },
      };

      await sender.sendMessages(message);
      console.log(`  ✓ Sent order ${i + 1}/${orders.length}: ${order.order_id}`);
    }
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

async function main(): Promise<void> {
  // Customer 1 orders
  const customer1Orders: Order[] = [
    { order_id: "ORD-001", product: "Laptop", amount: 1200 },
    { order_id: "ORD-002", product: "Mouse", amount: 25 },
    { order_id: "ORD-003", product: "Keyboard", amount: 75 },
  ];

  // Customer 2 orders
  const customer2Orders: Order[] = [
    { order_id: "ORD-004", product: "Monitor", amount: 400 },
    { order_id: "ORD-005", product: "Webcam", amount: 80 },
  ];

  await sendCustomerOrders("customer-1", customer1Orders);
  await sendCustomerOrders("customer-2", customer2Orders);

  console.log("\n✓ All orders sent");
  console.log("  - Each customer's orders will be processed in order");
  console.log("  - Different customers can be processed in parallel");
}

if (require.main === module) {
  main().catch(console.error);
}

export { sendCustomerOrders };
