// managed_identity_client.ts
import { ServiceBusClient } from "@azure/service-bus";
import { DefaultAzureCredential } from "@azure/identity";

const NAMESPACE_FQDN = "sb-prod-messaging.servicebus.windows.net";
const QUEUE_NAME = "orders";

interface OrderMessage {
  order_id: string;
  amount: number;
}

/**
 * Create Service Bus client using Managed Identity
 * DefaultAzureCredential automatically uses:
 * - Managed Identity in Azure
 * - Azure CLI locally
 * - Environment variables
 */
function createClientWithManagedIdentity(): ServiceBusClient {
  const credential = new DefaultAzureCredential();

  return new ServiceBusClient(NAMESPACE_FQDN, credential);
}

/**
 * Send message using Managed Identity
 */
async function sendMessageWithMI(): Promise<void> {
  const client = createClientWithManagedIdentity();
  const sender = client.createSender(QUEUE_NAME);

  try {
    const message: OrderMessage = {
      order_id: "ORD-001",
      amount: 99.99,
    };

    await sender.sendMessages({ body: message });
    console.log("Message sent using Managed Identity");
  } finally {
    await sender.close();
    await client.close();
  }
}

/**
 * Receive messages using Managed Identity
 */
async function receiveMessagesWithMI(): Promise<void> {
  const client = createClientWithManagedIdentity();
  const receiver = client.createReceiver(QUEUE_NAME);

  try {
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    for (const message of messages) {
      console.log("Received:", message.body);
      await receiver.completeMessage(message);
    }
  } finally {
    await receiver.close();
    await client.close();
  }
}

if (require.main === module) {
  sendMessageWithMI().catch(console.error);
}

export { createClientWithManagedIdentity, sendMessageWithMI, receiveMessagesWithMI };
