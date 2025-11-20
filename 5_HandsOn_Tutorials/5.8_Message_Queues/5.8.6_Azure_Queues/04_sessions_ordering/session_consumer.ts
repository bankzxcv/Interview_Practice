// session_consumer.ts
import { ServiceBusClient, ServiceBusSessionReceiver } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders-per-customer";

interface Order {
  order_id: string;
  product: string;
  amount: number;
}

interface SessionState {
  total_amount: number;
  order_count: number;
  last_processed: string;
}

/**
 * Process all orders for a specific customer (session)
 */
async function processCustomerSession(customerId: string): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);

  // Get receiver for specific session
  const receiver: ServiceBusSessionReceiver = await sbClient.acceptSession(
    QUEUE_NAME,
    customerId
  );

  try {
    console.log(`\n=== Processing Session: ${customerId} ===`);
    console.log(`Locked session: ${receiver.sessionId}`);

    // Get session state
    const sessionStateData = await receiver.getSessionState();
    if (sessionStateData) {
      const state = JSON.parse(sessionStateData.toString());
      console.log(`Session state: ${JSON.stringify(state)}`);
    } else {
      console.log("No previous session state");
    }

    // Process all messages in session
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    let totalAmount = 0;
    let orderCount = 0;

    for (const message of messages) {
      const body = message.body as Order;
      const props = message.applicationProperties;

      console.log(`\n  Order #${props?.order_sequence}`);
      console.log(`    Order ID: ${body.order_id}`);
      console.log(`    Product: ${body.product}`);
      console.log(`    Amount: $${body.amount}`);

      // Process order
      await processOrder(body);

      // Update totals
      totalAmount += body.amount;
      orderCount++;

      // Complete message
      await receiver.completeMessage(message);
    }

    // Save session state
    const sessionState: SessionState = {
      total_amount: totalAmount,
      order_count: orderCount,
      last_processed: new Date().toISOString(),
    };

    await receiver.setSessionState(JSON.stringify(sessionState));
    console.log(`\n✓ Session complete:`);
    console.log(`  Orders processed: ${orderCount}`);
    console.log(`  Total amount: $${totalAmount}`);
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

async function processOrder(order: Order): Promise<void> {
  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Process next available session
 */
async function processNextAvailableSession(): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);

  try {
    const receiver = await sbClient.acceptNextSession(QUEUE_NAME, {
      maxWaitTimeInMs: 10000,
    });

    console.log(`\n=== Accepted Session: ${receiver.sessionId} ===`);

    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    for (const message of messages) {
      console.log(`  Processing: ${(message.body as Order).order_id}`);
      await receiver.completeMessage(message);
    }

    console.log(`✓ Session ${receiver.sessionId} complete`);

    await receiver.close();
  } finally {
    await sbClient.close();
  }
}

if (require.main === module) {
  processCustomerSession("customer-1").catch(console.error);
}

export { processCustomerSession, processNextAvailableSession };
