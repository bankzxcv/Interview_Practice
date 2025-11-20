#!/usr/bin/env ts-node
/**
 * Kafka Avro Consumer - TypeScript Implementation
 * Demonstrates automatic schema resolution and Avro deserialization
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

// User schema interface
interface User {
  id: number;
  name: string;
  age: number;
  created_at: number;
}

/**
 * Avro Consumer Class
 */
class AvroConsumerExample {
  private consumer: Consumer;
  private registry: SchemaRegistry;
  private topic: string;

  constructor(
    bootstrapServers: string[],
    schemaRegistryUrl: string,
    groupId: string,
    topic: string
  ) {
    // Initialize Kafka consumer
    const kafka = new Kafka({
      clientId: 'avro-consumer',
      brokers: bootstrapServers,
    });

    this.consumer = kafka.consumer({
      groupId: groupId,
    });

    this.topic = topic;

    // Initialize Schema Registry
    this.registry = new SchemaRegistry({
      host: schemaRegistryUrl,
    });
  }

  /**
   * Connect consumer
   */
  async connect(): Promise<void> {
    await this.consumer.connect();
    console.log('✅ Avro Consumer connected');
  }

  /**
   * Decode Avro message
   */
  async decodeMessage(buffer: Buffer): Promise<User> {
    try {
      // Schema Registry automatically fetches schema by ID embedded in message
      const decodedMessage = await this.registry.decode(buffer);
      return decodedMessage as User;
    } catch (error) {
      console.error('❌ Error decoding message:', error);
      throw error;
    }
  }

  /**
   * Consume messages from topic
   */
  async consumeMessages(numMessages?: number): Promise<void> {
    await this.consumer.subscribe({
      topic: this.topic,
      fromBeginning: true,
    });

    console.log(`📥 Subscribed to topic: ${this.topic}`);
    console.log(`👥 Consumer group: ${this.consumer}`);
    console.log('⏳ Waiting for messages...\n');

    let messageCount = 0;

    await this.consumer.run({
      autoCommit: true,
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const { topic, partition, message } = payload;

          if (numMessages && messageCount >= numMessages) {
            await this.consumer.stop();
            return;
          }

          // Decode Avro message
          if (message.value) {
            const user = await this.decodeMessage(message.value);

            messageCount++;

            console.log(`📨 Message ${messageCount}:`);
            console.log(`   Key: ${message.key?.toString()}`);
            console.log(`   Value:`, user);
            console.log(`   Topic: ${topic}`);
            console.log(`   Partition: ${partition}`);
            console.log(`   Offset: ${message.offset}`);
            console.log();
          }
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      },
    });
  }

  /**
   * Close consumer
   */
  async close(): Promise<void> {
    console.log('\n🔌 Closing consumer...');
    await this.consumer.disconnect();
    console.log('✅ Consumer closed');
  }
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandler(consumer: AvroConsumerExample): void {
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
  console.log('🚀 Starting Avro Consumer with Schema Registry\n');

  const BOOTSTRAP_SERVERS = ['localhost:9092'];
  const SCHEMA_REGISTRY_URL = 'http://localhost:8081';
  const GROUP_ID = 'avro-consumer-group';
  const TOPIC = 'users-avro';

  const consumer = new AvroConsumerExample(
    BOOTSTRAP_SERVERS,
    SCHEMA_REGISTRY_URL,
    GROUP_ID,
    TOPIC
  );

  try {
    await consumer.connect();

    // Setup graceful shutdown
    setupShutdownHandler(consumer);

    // Consume messages
    await consumer.consumeMessages();
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

export { AvroConsumerExample, User };
