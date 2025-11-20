// event_publisher.ts
import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";

const TOPIC_ENDPOINT = process.env.EVENT_GRID_TOPIC_ENDPOINT || "";
const TOPIC_KEY = process.env.EVENT_GRID_TOPIC_KEY || "";

interface OrderData {
  order_id: string;
  customer_id: string;
  amount: number;
  items: string[];
}

/**
 * Create Event Grid publisher client
 */
function createPublisher(): EventGridPublisherClient {
  const credential = new AzureKeyCredential(TOPIC_KEY);
  return new EventGridPublisherClient(TOPIC_ENDPOINT, "EventGrid", credential);
}

/**
 * Publish order event to Event Grid
 */
async function publishOrderEvent(orderData: OrderData): Promise<void> {
  const client = createPublisher();

  // Create event
  const event = {
    id: `${Date.now()}-${Math.random()}`,
    eventType: "Orders.OrderCreated",
    subject: `orders/${orderData.order_id}`,
    dataVersion: "1.0",
    eventTime: new Date(),
    data: {
      order_id: orderData.order_id,
      customer_id: orderData.customer_id,
      amount: orderData.amount,
      items: orderData.items,
    },
  };

  // Send event
  await client.send([event]);
  console.log(`Published event: ${event.eventType}`);
  console.log(`Event ID: ${event.id}`);
}

/**
 * Publish multiple events in batch
 */
async function publishMultipleEvents(
  events: Array<{ type: string; subject: string; data: unknown }>
): Promise<void> {
  const client = createPublisher();

  const eventList = events.map((eventData) => ({
    id: `${Date.now()}-${Math.random()}`,
    eventType: eventData.type,
    subject: eventData.subject,
    dataVersion: "1.0",
    eventTime: new Date(),
    data: eventData.data,
  }));

  // Send batch
  await client.send(eventList);
  console.log(`Published ${eventList.length} events`);
}

async function main(): Promise<void> {
  // Publish single event
  const order: OrderData = {
    order_id: "ORD-001",
    customer_id: "CUST-123",
    amount: 99.99,
    items: ["item1", "item2"],
  };
  await publishOrderEvent(order);

  // Publish multiple events
  const events = [
    {
      type: "Orders.OrderCreated",
      subject: "orders/ORD-002",
      data: { order_id: "ORD-002", amount: 50.0 },
    },
    {
      type: "Orders.OrderShipped",
      subject: "orders/ORD-001",
      data: { order_id: "ORD-001", tracking: "TRACK123" },
    },
  ];
  await publishMultipleEvents(events);
}

if (require.main === module) {
  main().catch(console.error);
}

export { publishOrderEvent, publishMultipleEvents };
