import { connect, NatsConnection, StringCodec } from 'nats';

/**
 * Request payload interface
 */
interface UserRequest {
  user_id: number;
}

/**
 * Response payload interface
 */
interface UserResponse {
  user_id: number;
  name: string;
}

/**
 * Make a single request and measure duration
 */
async function makeRequest(nc: NatsConnection, userId: number): Promise<void> {
  const sc = StringCodec();
  const request: UserRequest = { user_id: userId };

  const startTime = Date.now();

  try {
    const response = await nc.request(
      'user.get',
      sc.encode(JSON.stringify(request)),
      { timeout: 2000 }
    );

    const duration = (Date.now() - startTime) / 1000;
    const userData: UserResponse = JSON.parse(sc.decode(response.data));

    console.log(`User ${userId}: ${userData.name} (${duration.toFixed(3)}s)`);
  } catch (err) {
    console.error(`User ${userId}: Error - ${err.message}`);
  }
}

/**
 * Concurrent requests example
 * Makes multiple requests in parallel to test load balancing
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Making 10 concurrent requests...\n');

  const startTime = Date.now();

  try {
    // Make 10 requests concurrently
    const tasks: Promise<void>[] = [];
    for (let i = 1; i <= 10; i++) {
      tasks.push(makeRequest(nc, i));
    }

    await Promise.all(tasks);

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\nTotal time: ${totalTime.toFixed(3)}s`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the concurrent requester
main().catch(console.error);
