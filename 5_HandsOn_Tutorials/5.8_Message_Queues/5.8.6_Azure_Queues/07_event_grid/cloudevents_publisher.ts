// cloudevents_publisher.ts
import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";

const TOPIC_ENDPOINT = process.env.EVENT_GRID_TOPIC_ENDPOINT || "";
const TOPIC_KEY = process.env.EVENT_GRID_TOPIC_KEY || "";

interface OrderData {
  order_id: string;
  customer_id: string;
  amount: number;
}

/**
 * Publish event using CloudEvents 1.0 schema
 */
async function publishCloudEvent(orderData: OrderData): Promise<void> {
  const credential = new AzureKeyCredential(TOPIC_KEY);
  const client = new EventGridPublisherClient(TOPIC_ENDPOINT, "CloudEvent", credential);

  // Create CloudEvent
  const event = {
    id: `${Date.now()}-${Math.random()}`,
    type: "com.example.orders.created",
    source: "/orders/api",
    specversion: "1.0",
    time: new Date(),
    datacontenttype: "application/json",
    data: {
      order_id: orderData.order_id,
      customer_id: orderData.customer_id,
      amount: orderData.amount,
    },
  };

  // Send event
  await client.send([event]);
  console.log(`Published CloudEvent: ${event.type}`);
  console.log(`Event ID: ${event.id}`);
}

async function main(): Promise<void> {
  const order: OrderData = {
    order_id: "ORD-001",
    customer_id: "CUST-123",
    amount: 99.99,
  };
  await publishCloudEvent(order);
}

if (require.main === module) {
  main().catch(console.error);
}

export { publishCloudEvent };
