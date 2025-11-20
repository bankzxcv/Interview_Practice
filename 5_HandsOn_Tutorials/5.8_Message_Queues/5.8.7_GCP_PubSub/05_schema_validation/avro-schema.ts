// avro-schema.ts
import { PubSub, SchemaType, Schema } from '@google-cloud/pubsub';

// Avro schema definition
const AVRO_SCHEMA_DEFINITION = `{
  "type": "record",
  "name": "Order",
  "namespace": "com.example",
  "fields": [
    {
      "name": "order_id",
      "type": "string"
    },
    {
      "name": "customer_id",
      "type": "string"
    },
    {
      "name": "amount",
      "type": "double"
    },
    {
      "name": "currency",
      "type": "string",
      "default": "USD"
    },
    {
      "name": "timestamp",
      "type": "long"
    },
    {
      "name": "status",
      "type": {
        "type": "enum",
        "name": "OrderStatus",
        "symbols": ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]
      }
    }
  ]
}`;

/**
 * Create an Avro schema
 */
async function createAvroSchema(
  projectId: string,
  schemaId: string
): Promise<Schema> {
  const pubsub = new PubSub({ projectId });

  try {
    const schema = await pubsub.createSchema(
      schemaId,
      SchemaType.Avro,
      AVRO_SCHEMA_DEFINITION
    );

    console.log(`✓ Avro schema created: ${schema.name}`);
    return schema;
  } catch (error) {
    console.error('✗ Error creating schema:', error);
    throw error;
  }
}

/**
 * Get schema details
 */
async function getSchema(projectId: string, schemaId: string): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const schema = pubsub.schema(schemaId);

  const [metadata] = await schema.get();

  console.log(`Schema: ${metadata.name}`);
  console.log(`Type: ${metadata.type}`);
  console.log(`Definition:`);
  console.log(metadata.definition);
}

/**
 * List all schemas in project
 */
async function listSchemas(projectId: string): Promise<void> {
  const pubsub = new PubSub({ projectId });

  console.log(`Schemas in project ${projectId}:`);
  const [schemas] = await pubsub.getSchemas();

  schemas.forEach((schema) => {
    console.log(`  - ${schema.name} (${schema.type})`);
  });
}

/**
 * Delete a schema
 */
async function deleteSchema(projectId: string, schemaId: string): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const schema = pubsub.schema(schemaId);

  await schema.delete();
  console.log(`✓ Schema deleted: ${schemaId}`);
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const SCHEMA_ID = 'order-schema-avro';

  (async () => {
    // Create Avro schema
    await createAvroSchema(PROJECT_ID, SCHEMA_ID);

    // Get schema
    await getSchema(PROJECT_ID, SCHEMA_ID);

    // List schemas
    await listSchemas(PROJECT_ID);
  })().catch(console.error);
}

export { createAvroSchema, getSchema, listSchemas, deleteSchema, AVRO_SCHEMA_DEFINITION };
