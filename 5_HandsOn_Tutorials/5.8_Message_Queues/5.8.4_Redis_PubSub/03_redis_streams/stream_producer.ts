#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

interface SensorReading {
  sensor_type: string;
  value: string;
  timestamp: string;
  unit: string;
}

interface EventData {
  event_type: string;
  data: string;
  timestamp: string;
}

/**
 * Create Redis client
 */
async function createRedisClient(): Promise<RedisClientType> {
  const client = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
    },
  });

  await client.connect();
  return client;
}

/**
 * Add sensor reading to stream
 */
async function addSensorReading(
  client: RedisClientType,
  streamName: string,
  sensorType: string,
  value: number
): Promise<string> {
  const entry: SensorReading = {
    sensor_type: sensorType,
    value: value.toString(),
    timestamp: new Date().toISOString(),
    unit: sensorType === 'temperature' ? 'celsius' : 'percent',
  };

  // XADD returns the generated ID
  const entryId = await client.xAdd(streamName, '*', entry as any);
  console.log(`Added entry ${entryId}: ${sensorType}=${value}`);
  return entryId;
}

/**
 * Add structured event to stream
 */
async function addEvent(
  client: RedisClientType,
  streamName: string,
  eventType: string,
  data: Record<string, any>
): Promise<string> {
  const entry: EventData = {
    event_type: eventType,
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  };

  const entryId = await client.xAdd(streamName, '*', entry as any);
  console.log(`Added event ${entryId}: ${eventType}`);
  return entryId;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Random number in range
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  let client: RedisClientType | null = null;

  try {
    client = await createRedisClient();
    console.log('Adding sensor readings...\n');

    // Add sensor data
    for (let i = 0; i < 10; i++) {
      // Temperature reading
      const temp = Math.round((20 + randomInRange(-2, 5)) * 10) / 10;
      await addSensorReading(client, 'sensors', 'temperature', temp);

      // Humidity reading
      const humidity = Math.round((60 + randomInRange(-10, 15)) * 10) / 10;
      await addSensorReading(client, 'sensors', 'humidity', humidity);

      await sleep(500);
    }

    console.log('\nAdding structured events...\n');

    // Add application events
    const events: Array<[string, Record<string, any>]> = [
      ['user_login', { user_id: 123, username: 'john' }],
      ['order_created', { order_id: 456, total: 99.99 }],
      ['payment_processed', { order_id: 456, amount: 99.99 }],
      ['order_shipped', { order_id: 456, tracking: 'TRACK123' }],
    ];

    for (const [eventType, data] of events) {
      await addEvent(client, 'events', eventType, data);
      await sleep(300);
    }

    // Get stream info
    const sensorLen = await client.xLen('sensors');
    const eventsLen = await client.xLen('events');

    console.log('\n' + '='.repeat(60));
    console.log(`Stream 'sensors': ${sensorLen} entries`);
    console.log(`Stream 'events': ${eventsLen} entries`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.quit();
    }
  }
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

export { createRedisClient, addSensorReading, addEvent };
