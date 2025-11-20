import { connect, NatsConnection, StringCodec } from 'nats';

/**
 * Test a single request scenario
 */
async function testRequest(
  nc: NatsConnection,
  request: any,
  description: string
): Promise<void> {
  console.log(`\nTest: ${description}`);
  console.log(`  Request: ${JSON.stringify(request)}`);

  const sc = StringCodec();

  try {
    const response = await nc.request(
      'user.get',
      sc.encode(JSON.stringify(request)),
      { timeout: 2000 }
    );

    const result = JSON.parse(sc.decode(response.data));
    console.log(`  Response: ${JSON.stringify(result)}`);
  } catch (err) {
    if (err.code === 'TIMEOUT' || err.code === '503') {
      console.log('  Response: TIMEOUT');
    } else {
      console.log(`  Response: Error - ${err.message}`);
    }
  }
}

/**
 * Error testing example
 * Tests various error scenarios with the robust responder
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Testing error handling...\n');

  try {
    // Test cases
    await testRequest(nc, { user_id: 42 }, 'Valid request');
    await testRequest(nc, {}, 'Missing user_id');
    await testRequest(nc, { user_id: -5 }, 'Invalid user_id (negative)');
    await testRequest(nc, { user_id: 'abc' }, 'Invalid user_id (string)');
    await testRequest(nc, { user_id: 1001 }, 'User not found');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the error tests
main().catch(console.error);
