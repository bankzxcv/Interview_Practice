#!/usr/bin/env ts-node
/**
 * Transactional Producer - TypeScript Implementation
 * Demonstrates atomic writes across multiple partitions/topics using transactions
 */

import { Kafka, Producer, ProducerRecord, Transaction } from 'kafkajs';

interface OrderMessage {
  order_id: string;
  customer_id: string;
  amount: number;
  status: string;
}

/**
 * Transactional Producer Class
 */
class TransactionalProducer {
  private producer: Producer;
  private transactionalId: string;

  constructor(bootstrapServers: string[], transactionalId: string) {
    this.transactionalId = transactionalId;

    const kafka = new Kafka({
      clientId: 'transactional-producer',
      brokers: bootstrapServers,
    });

    this.producer = kafka.producer({
      transactionalId: transactionalId,
      maxInFlightRequests: 1,
      idempotent: true, // Automatically enabled with transactions
    });
  }

  /**
   * Connect producer
   */
  async connect(): Promise<void> {
    await this.producer.connect();
    console.log(`🔧 Initializing transactions for: ${this.transactionalId}`);
    console.log('✅ Transactional producer ready\n');
  }

  /**
   * Produce messages to multiple topics atomically
   */
  async produceTransactionalBatch(
    messagesByTopic: Record<string, Array<{ key: string; value: OrderMessage }>>
  ): Promise<boolean> {
    const transaction: Transaction = await this.producer.transaction();

    try {
      console.log('🔷 BEGIN TRANSACTION');

      let totalMessages = 0;

      // Send all messages within transaction
      for (const [topic, messages] of Object.entries(messagesByTopic)) {
        console.log(`   📤 Producing to ${topic}: ${messages.length} messages`);

        for (const { key, value } of messages) {
          await transaction.send({
            topic,
            messages: [
              {
                key,
                value: JSON.stringify(value),
              },
            ],
          });
          totalMessages++;
        }
      }

      // Commit transaction (all or nothing)
      console.log(`   ⏳ Committing ${totalMessages} messages...`);
      await transaction.commit();
      console.log('   ✅ TRANSACTION COMMITTED\n');

      return true;
    } catch (error) {
      // Abort transaction on error
      console.error('   ❌ Transaction failed:', error);
      console.log('   🔄 ABORTING TRANSACTION\n');
      await transaction.abort();
      return false;
    }
  }

  /**
   * Produce with failure simulation
   */
  async produceWithFailureSimulation(
    topic: string,
    messages: Array<{ key: string; value: OrderMessage }>,
    failAfter?: number
  ): Promise<boolean> {
    const transaction: Transaction = await this.producer.transaction();

    try {
      console.log('🔷 BEGIN TRANSACTION (with failure simulation)');

      for (let i = 0; i < messages.length; i++) {
        if (failAfter !== undefined && i >= failAfter) {
          console.log(`   💥 Simulating failure after ${i} messages`);
          throw new Error('Simulated failure');
        }

        const { key, value } = messages[i];
        await transaction.send({
          topic,
          messages: [
            {
              key,
              value: JSON.stringify(value),
            },
          ],
        });

        console.log(`   📤 Message ${i + 1}: key=${key}, value=${JSON.stringify(value)}`);
      }

      console.log('   ⏳ Committing transaction...');
      await transaction.commit();
      console.log('   ✅ TRANSACTION COMMITTED\n');
      return true;
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
      console.log('   🔄 ABORTING TRANSACTION');
      console.log('   ⚠️  All messages in transaction are rolled back\n');
      await transaction.abort();
      return false;
    }
  }

  /**
   * Close producer
   */
  async close(): Promise<void> {
    console.log('🔌 Closing producer...');
    await this.producer.disconnect();
    console.log('✅ Producer closed');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🚀 Transactional Producer Example\n');
  console.log('='.repeat(70));

  const BOOTSTRAP_SERVERS = ['localhost:9092'];
  const TRANSACTIONAL_ID = 'my-transactional-producer-1';

  const producer = new TransactionalProducer(BOOTSTRAP_SERVERS, TRANSACTIONAL_ID);

  try {
    await producer.connect();

    // Test 1: Successful transaction
    console.log('\n📌 TEST 1: Successful atomic transaction across topics');
    console.log('-'.repeat(70));

    const messagesByTopic: Record<string, Array<{ key: string; value: OrderMessage }>> = {
      'transactions-input': [
        { key: 'order-1', value: { order_id: 'order-1', customer_id: 'cust-1', amount: 100, status: 'purchase' } },
        { key: 'order-2', value: { order_id: 'order-2', customer_id: 'cust-2', amount: 200, status: 'purchase' } },
      ],
      'transactions-output': [
        { key: 'order-1', value: { order_id: 'order-1', customer_id: 'cust-1', amount: 100, status: 'confirmed' } },
        { key: 'order-2', value: { order_id: 'order-2', customer_id: 'cust-2', amount: 200, status: 'confirmed' } },
      ],
    };

    await producer.produceTransactionalBatch(messagesByTopic);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Failed transaction (all messages rolled back)
    console.log('\n📌 TEST 2: Failed transaction - all messages rolled back');
    console.log('-'.repeat(70));

    const messages = [
      { key: 'order-3', value: { order_id: 'order-3', customer_id: 'cust-3', amount: 300, status: 'purchase' } },
      { key: 'order-4', value: { order_id: 'order-4', customer_id: 'cust-4', amount: 400, status: 'purchase' } },
      { key: 'order-5', value: { order_id: 'order-5', customer_id: 'cust-5', amount: 500, status: 'purchase' } },
    ];

    await producer.produceWithFailureSimulation('transactions-input', messages, 2);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: Another successful transaction
    console.log('\n📌 TEST 3: Successful transaction after previous failure');
    console.log('-'.repeat(70));

    const messages2 = [
      { key: 'order-6', value: { order_id: 'order-6', customer_id: 'cust-6', amount: 600, status: 'purchase' } },
      { key: 'order-7', value: { order_id: 'order-7', customer_id: 'cust-7', amount: 700, status: 'purchase' } },
    ];

    await producer.produceWithFailureSimulation('transactions-input', messages2);

    console.log('\n' + '='.repeat(70));
    await producer.close();
    console.log('✨ Transactional producer test complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    await producer.close();
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

export { TransactionalProducer, OrderMessage };
