// dlq_monitor.ts
import { ServiceBusClient, ServiceBusMessage } from "@azure/service-bus";

const CONNECTION_STRING = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || "";
const QUEUE_NAME = "orders";

/**
 * Monitor dead letter queue
 */
async function monitorDeadLetterQueue(): Promise<void> {
  const sbClient = new ServiceBusClient(CONNECTION_STRING);
  const receiver = sbClient.createReceiver(QUEUE_NAME, {
    subQueueType: "deadLetter",
  });

  console.log("=== Dead Letter Queue Monitor ===\n");

  try {
    const messages = await receiver.peekMessages(32);

    if (messages.length === 0) {
      console.log("No messages in dead letter queue");
      return;
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`\n--- Dead Letter Message ${i + 1} ---`);
      console.log(`Message ID: ${message.messageId}`);
      console.log(`Body: ${JSON.stringify(message.body)}`);
      console.log(`Delivery Count: ${message.deliveryCount}`);
      console.log(`Enqueued Time: ${message.enqueuedTimeUtc}`);

      console.log("\nDead Letter Info:");
      console.log(`  Reason: ${message.deadLetterReason}`);
      console.log(`  Error: ${message.deadLetterErrorDescription}`);
      console.log(`  Source: ${message.deadLetterSource}`);

      if (message.applicationProperties) {
        console.log("\nApplication Properties:");
        for (const [key, value] of Object.entries(message.applicationProperties)) {
          console.log(`  ${key}: ${value}`);
        }
      }
    }
  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

/**
 * Resubmit messages from dead letter queue
 */
async function resubmitDeadLetterMessages(): Promise<void> {
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
      console.log(`\nProcessing DLQ message: ${message.messageId}`);
      console.log(`Original reason: ${message.deadLetterReason}`);

      // Check if message can be repaired
      if (canRepairMessage(message)) {
        // Repair message
        const repairedData = repairMessage(message.body);

        // Create new message
        const newMessage: ServiceBusMessage = {
          body: repairedData,
        };

        // Send to main queue
        await sender.sendMessages(newMessage);
        console.log("✓ Resubmitted repaired message");

        // Remove from DLQ
        await dlqReceiver.completeMessage(message);
      } else {
        console.log("✗ Cannot repair, keeping in DLQ");
      }
    }
  } finally {
    await dlqReceiver.close();
    await sender.close();
    await sbClient.close();
  }
}

function canRepairMessage(message: any): boolean {
  return message.deadLetterReason === "ValidationFailed";
}

function repairMessage(data: any): any {
  // Add missing fields with defaults
  if (!data.customer_id) {
    data.customer_id = "UNKNOWN";
  }
  if (!data.amount) {
    data.amount = 0;
  }
  return data;
}

if (require.main === module) {
  monitorDeadLetterQueue().catch(console.error);
}

export { monitorDeadLetterQueue, resubmitDeadLetterMessages };
