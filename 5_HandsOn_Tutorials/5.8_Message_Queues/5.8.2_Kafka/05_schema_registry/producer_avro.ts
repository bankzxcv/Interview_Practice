#!/usr/bin/env ts-node
/**
 * Kafka Avro Producer - TypeScript Implementation
 * Demonstrates schema registration and Avro serialization with Schema Registry
 */

import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import * as avro from 'avro-js';

// User schema interface
interface User {
  id: number;
  name: string;
  age: number;
  created_at: number;
}

// Avro schema definition
const userSchema = {
  type: 'record',
  name: 'User',
  namespace: 'com.example.kafka',
  doc: 'User information schema version 1',
  fields: [
    {
      name: 'id',
      type: 'int',
      doc: 'User unique identifier',
    },
    {
      name: 'name',
      type: 'string',
      doc: 'User full name',
    },
    {
      name: 'age',
      type: 'int',
      doc: 'User age in years',
    },
    {
      name: 'created_at',
      type: 'long',
      logicalType: 'timestamp-millis',
      doc: 'Creation timestamp in milliseconds',
    },
  ],
};

/**
 * Avro Producer Class
 */
class AvroProducerExample {
  private producer: Producer;
  private registry: SchemaRegistry;
  private topic: string;

  constructor(
    bootstrapServers: string[],
    schemaRegistryUrl: string,
    topic: string
  ) {
    // Initialize Kafka producer
    const kafka = new Kafka({
      clientId: 'avro-producer',
      brokers: bootstrapServers,
    });

    this.producer = kafka.producer();
    this.topic = topic;

    // Initialize Schema Registry
    this.registry = new SchemaRegistry({
      host: schemaRegistryUrl,
    });
  }

  /**
   * Connect producer
   */
  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('✅ Avro Producer connected');
  }

  /**
   * Encode user data with Avro schema
   */
  async encodeUser(user: User): Promise<Buffer> {
    try {
      // Register schema and get schema ID
      const { id } = await this.registry.register({
        type: SchemaType.AVRO,
        schema: JSON.stringify(userSchema),
      });

      // Encode the message
      const encodedMessage = await this.registry.encode(id, user);
      return encodedMessage;
    } catch (error) {
      console.error('❌ Error encoding user:', error);
      throw error;
    }
  }

  /**
   * Produce a user message
   */
  async produceUser(user: User): Promise<void> {
    try {
      // Encode user with Avro schema
      const encodedValue = await this.encodeUser(user);

      const record: ProducerRecord = {
        topic: this.topic,
        messages: [
          {
            key: user.id.toString(),
            value: encodedValue,
            headers: {
              'content-type': 'application/avro',
            },
          },
        ],
      };

      const metadata = await this.producer.send(record);

      metadata.forEach((meta) => {
        console.log(
          `✅ Message delivered to ${this.topic} ` +
          `[${meta.partition}] at offset ${meta.offset}`
        );
      });
    } catch (error) {
      console.error('❌ Failed to produce message:', error);
      throw error;
    }
  }

  /**
   * Close producer
   */
  async close(): Promise<void> {
    console.log('\n📤 Flushing remaining messages...');
    await this.producer.disconnect();
    console.log('✅ Producer closed');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Avro Producer with Schema Registry\n');

  const BOOTSTRAP_SERVERS = ['localhost:9092'];
  const SCHEMA_REGISTRY_URL = 'http://localhost:8081';
  const TOPIC = 'users-avro';

  const producer = new AvroProducerExample(
    BOOTSTRAP_SERVERS,
    SCHEMA_REGISTRY_URL,
    TOPIC
  );

  try {
    await producer.connect();

    // Sample user data
    const users: User[] = [
      {
        id: 1,
        name: 'Alice Johnson',
        age: 30,
        created_at: Date.now(),
      },
      {
        id: 2,
        name: 'Bob Smith',
        age: 25,
        created_at: Date.now(),
      },
      {
        id: 3,
        name: 'Charlie Brown',
        age: 35,
        created_at: Date.now(),
      },
      {
        id: 4,
        name: 'Diana Prince',
        age: 28,
        created_at: Date.now(),
      },
      {
        id: 5,
        name: 'Eve Davis',
        age: 32,
        created_at: Date.now(),
      },
    ];

    console.log(`📤 Producing ${users.length} user messages to topic: ${TOPIC}\n`);

    for (const user of users) {
      await producer.produceUser(user);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await producer.close();
    console.log('\n✨ Producer finished successfully!');
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

export { AvroProducerExample, User, userSchema };
