#!/usr/bin/env ts-node
/**
 * Producer with Key-Based Partitioning - TypeScript Implementation
 * Ensures all orders for same customer go to same partition for ordering guarantees
 */

import { Kafka, Producer, ProducerRecord, RecordMetadata, CompressionTypes } from 'kafkajs';

interface OrderEvent {
  order_id: string;
  customer_id: string;
  order_type: 'created' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  amount: number;
  timestamp: string;
}

/**
 * Create Kafka producer with custom partitioner
 */
async function createProducer(): Promise<Producer> {
  const kafka = new Kafka({
    clientId: 'order-producer',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    idempotent: true,
    compression: CompressionTypes.Snappy,
  });

  await producer.connect();
  console.log('✅ Idempotent producer initialized');
  console.log('   Config: idempotent=true, compression=snappy\n');

  return producer;
}

/**
 * Send order events with customer_id as key
 */
async function sendOrderEvents(
  producer: Producer,
  numOrders: number = 30
): Promise<void> {
  const customers = Array.from({ length: 5 }, (_, i) => `customer-${i + 1}`);
  const orderTypes: OrderEvent['order_type'][] = [
    'created',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
  ];

  const partitionStats: Record<number, number> = {};

  try {
    for (let orderId = 1; orderId <= numOrders; orderId++) {
      const customerId = customers[Math.floor(Math.random() * customers.length)];
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];

      const order: OrderEvent = {
        order_id: `order-${orderId}`,
        customer_id: customerId,
        order_type: orderType,
        amount: parseFloat((Math.random() * 990 + 10).toFixed(2)),
        timestamp: new Date().toISOString(),
      };

      // Key ensures all orders for same customer go to same partition
      const record: ProducerRecord = {
        topic: 'order-events',
        messages: [
          {
            key: customerId,
            value: JSON.stringify(order),
          },
        ],
      };

      const metadata: RecordMetadata[] = await producer.send(record);

      metadata.forEach((meta) => {
        // Track partition distribution
        partitionStats[meta.partition] = (partitionStats[meta.partition] || 0) + 1;

        console.log(
          `Order ${orderId.toString().padStart(2, '0')} | ` +
          `Customer: ${customerId} | ` +
          `Type: ${orderType.padEnd(10)} | ` +
          `Partition: ${meta.partition} | ` +
          `Offset: ${meta.offset}`
        );
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Display partition distribution
    console.log('\n' + '='.repeat(60));
    console.log('Partition Distribution:');
    Object.entries(partitionStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([partition, count]) => {
        const bar = '█'.repeat(count);
        console.log(`Partition ${partition}: ${count.toString().padStart(3)} messages ${bar}`);
      });
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error sending orders:', error);
    throw error;
  } finally {
    await producer.disconnect();
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const producer = await createProducer();
    await sendOrderEvents(producer, 30);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createProducer, sendOrderEvents, OrderEvent };
