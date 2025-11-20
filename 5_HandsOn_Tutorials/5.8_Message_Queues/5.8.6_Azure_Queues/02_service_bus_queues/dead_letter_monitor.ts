// dead_letter_monitor.ts
import { ServiceBusClient, ServiceBusMessage } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders";

/**
 * Receive messages from dead letter queue
 */
async function receiveFromDeadLetter(): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);

  // Dead letter queue receiver
  const receiver = sbClient.createReceiver(QUEUE_NAME, {
    subQueueType: "deadLetter",
  });

  try {
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    console.log("=== Dead Letter Queue Messages ===");

    for (const message of messages) {
      console.log(`\nMessage ID: ${message.messageId}`);
      console.log(`Body: ${JSON.stringify(message.body)}`);
      console.log(`Delivery Count: ${message.deliveryCount}`);
      console.log(`Dead Letter Reason: ${message.deadLetterReason}`);
      console.log(
        `Dead Letter Error: ${message.deadLetterErrorDescription}`
      );

      // Optionally complete to remove from DLQ
      // await receiver.completeMessage(message);
    }
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

/**
 * Resubmit messages from dead letter queue
 */
async function resubmitFromDeadLetter(): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);

  const dlqReceiver = sbClient.createReceiver(QUEUE_NAME, {
    subQueueType: "deadLetter",
  });
  const sender = sbClient.createSender(QUEUE_NAME);

  try {
    const messages = await dlqReceiver.receiveMessages(10, {
      maxWaitTimeInMs: 5000,
    });

    for (const message of messages) {
      console.log(`\nResubmitting message: ${message.messageId}`);
      console.log(`Original reason: ${message.deadLetterReason}`);

      // Create new message from dead letter message
      const newMessage: ServiceBusMessage = {
        body: message.body,
        messageId: message.messageId || undefined,
      };

      // Send to main queue
      await sender.sendMessages(newMessage);

      // Remove from dead letter queue
      await dlqReceiver.completeMessage(message);
      console.log("Resubmitted and removed from DLQ");
    }
  } finally {
    await dlqReceiver.close();
    await sender.close();
    await sbClient.close();
  }
}

if (require.main === module) {
  receiveFromDeadLetter().catch(console.error);
}

export { receiveFromDeadLetter, resubmitFromDeadLetter };
