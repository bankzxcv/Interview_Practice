#!/usr/bin/env ts-node
/**
 * Transactional Consumer - TypeScript Implementation
 * Read committed messages only and process with exactly-once semantics
 */

import { Kafka, Consumer, Producer, EachMessagePayload, Transaction } from 'kafkajs';

interface OrderMessage {
  order_id: string;
  customer_id: string;
  amount: number;
  status: string;
}

/**
 * Transactional Consumer Class
 */
class TransactionalConsumer {
  private consumer: Consumer;
  private producer: Producer;
  private inputTopic: string;
  private outputTopic: string;

  constructor(
    bootstrapServers: string[],
    groupId: string,
    transactionalId: string,
    inputTopic: string,
    outputTopic: string
  ) {
    this.inputTopic = inputTopic;
    this.outputTopic = outputTopic;

    const kafka = new Kafka({
      clientId: 'transactional-consumer',
      brokers: bootstrapServers,
    });

    // Consumer with read-committed isolation
    this.consumer = kafka.consumer({
      groupId: groupId,
      isolationLevel: 'read_committed', // Read only committed messages
    });

    // Producer for output (transactional)
    this.producer = kafka.producer({
      transactionalId: transactionalId,
      idempotent: true,
    });
  }

  /**
   * Connect consumer and producer
   */
  async connect(): Promise<void> {
    await this.consumer.connect();
    await this.producer.connect();

    console.log('✅ Transactional consumer initialized');
    console.log('   Isolation level: read_committed');
    console.log(`   Input topic: ${this.inputTopic}`);
    console.log(`   Output topic: ${this.outputTopic}\n`);
  }

  /**
   * Process messages with exactly-once semantics
   */
  async processMessages(numMessages?: number): Promise<void> {
    await this.consumer.subscribe({
      topic: this.inputTopic,
      fromBeginning: true,
    });

    console.log('📥 Consuming from:', this.inputTopic);
    console.log('📤 Producing to:', this.outputTopic);
    console.log('🔷 Using exactly-once processing\n');

    let processedCount = 0;

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        if (numMessages && processedCount >= numMessages) {
          await this.consumer.stop();
          return;
        }

        const { topic, partition, message } = payload;

        // Begin transaction for processing
        const transaction: Transaction = await this.producer.transaction();

        try {
          // Process message
          const key = message.key?.toString() || '';
          const value = message.value?.toString() || '';
          const inputMessage: OrderMessage = JSON.parse(value);

          processedCount++;
          console.log(`📨 Message ${processedCount}:`);
          console.log(`   Input: key=${key}, value=${value}`);

          // Transform message (example: add prefix)
          const outputMessage: OrderMessage = {
            ...inputMessage,
            status: `processed:${inputMessage.status}`,
          };

          // Produce to output topic within transaction
          await transaction.send({
            topic: this.outputTopic,
            messages: [
              {
                key,
                value: JSON.stringify(outputMessage),
              },
            ],
          });

          console.log(`   Output: key=${key}, value=${JSON.stringify(outputMessage)}`);

          // Send consumer offsets to transaction (atomic commit)
          await transaction.sendOffsets({
            consumerGroupId: this.consumer.groupId,
            topics: [
              {
                topic: topic,
                partitions: [
                  {
                    partition: partition,
                    offset: (parseInt(message.offset) + 1).toString(),
                  },
                ],
              },
            ],
          });

          // Commit transaction (atomic: message + offset)
          await transaction.commit();
          console.log('   ✅ Transaction committed\n');
        } catch (error) {
          console.error('   ❌ Processing failed:', error);
          console.log('   🔄 Aborting transaction\n');
          await transaction.abort();
        }
      },
    });
  }

  /**
   * Close consumer and producer
   */
  async close(): Promise<void> {
    console.log('\n🔌 Closing consumer and producer...');
    await this.consumer.disconnect();
    await this.producer.disconnect();
    console.log('✅ Closed');
  }
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandler(consumer: TransactionalConsumer): void {
  const shutdown = async (signal: string) => {
    console.log(`\n⚠️  ${signal} received. Shutting down...`);
    try {
      await consumer.close();
      process.exit(0);
    } catch (error) {
      console.error('❌ Shutdown error:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🚀 Transactional Consumer Example\n');
  console.log('='.repeat(70));

  const BOOTSTRAP_SERVERS = ['localhost:9092'];
  const GROUP_ID = 'transactional-consumer-group';
  const TRANSACTIONAL_ID = 'my-transactional-consumer-1';
  const INPUT_TOPIC = 'transactions-input';
  const OUTPUT_TOPIC = 'transactions-output';

  const consumer = new TransactionalConsumer(
    BOOTSTRAP_SERVERS,
    GROUP_ID,
    TRANSACTIONAL_ID,
    INPUT_TOPIC,
    OUTPUT_TOPIC
  );

  try {
    await consumer.connect();

    // Setup graceful shutdown
    setupShutdownHandler(consumer);

    // Process messages with exactly-once semantics
    await consumer.processMessages();
  } catch (error) {
    console.error('Fatal error:', error);
    await consumer.close();
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

export { TransactionalConsumer, OrderMessage };
