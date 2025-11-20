// session_consumer.ts
import { ServiceBusClient, ServiceBusSessionReceiver } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders-with-sessions";

/**
 * Receive messages from a specific session or next available
 */
async function receiveSessionMessages(sessionId?: string): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);

  // Get session receiver
  const receiver: ServiceBusSessionReceiver = sessionId
    ? await sbClient.acceptSession(QUEUE_NAME, sessionId)
    : await sbClient.acceptNextSession(QUEUE_NAME);

  try {
    console.log(`Processing session: ${receiver.sessionId}`);

    // Get session state
    const sessionState = await receiver.getSessionState();
    if (sessionState) {
      console.log(`Session state: ${sessionState}`);
    }

    // Receive all messages from this session
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    let lastOrderId = "";
    for (const message of messages) {
      const body = message.body as { order_id: string; amount: number };
      console.log(`  Order: ${body.order_id}, Amount: ${body.amount}`);

      // Process and complete
      await receiver.completeMessage(message);
      lastOrderId = body.order_id;
    }

    // Update session state
    const newState = JSON.stringify({ last_processed: lastOrderId });
    await receiver.setSessionState(newState);
    console.log("Updated session state");
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

/**
 * Process all available sessions
 */
async function processAllSessions(): Promise<void> {
  while (true) {
    try {
      const sbClient = new ServiceBusClient(CONNECTION_STRING);
      const receiver = await sbClient.acceptNextSession(QUEUE_NAME, {
        maxWaitTimeInMs: 5000,
      });

      console.log(`\n=== Processing Session: ${receiver.sessionId} ===`);

      const messages = await receiver.receiveMessages(10, {
        maxWaitTimeInMs: 5000,
      });

      for (const message of messages) {
        console.log(`Order: ${JSON.stringify(message.body)}`);
        await receiver.completeMessage(message);
      }

      await receiver.close();
      await sbClient.close();
    } catch (error) {
      console.log("No more sessions available");
      break;
    }
  }
}

if (require.main === module) {
  processAllSessions().catch(console.error);
}

export { receiveSessionMessages, processAllSessions };
