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
  email: string;
  status: string;
}

/**
 * Basic request-reply requester (client)
 * Makes a request to 'user.get' and waits for response
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('User Service - Client\n');

  const sc = StringCodec();

  try {
    // Make request
    const request: UserRequest = {
      user_id: 12345
    };

    console.log(`Sending request: ${JSON.stringify(request)}\n`);

    // Send request and wait for response (2 second timeout)
    const response = await nc.request(
      'user.get',
      sc.encode(JSON.stringify(request)),
      { timeout: 2000 }
    );

    // Parse response
    const userData: UserResponse = JSON.parse(sc.decode(response.data));

    console.log('Response received:');
    console.log(`  User ID: ${userData.user_id}`);
    console.log(`  Name: ${userData.name}`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  Status: ${userData.status}`);

  } catch (err) {
    if (err.code === 'TIMEOUT' || err.code === '503') {
      console.error('ERROR: Request timed out (no responder available)');
    } else {
      console.error('ERROR:', err.message);
    }
  } finally {
    await nc.close();
  }
}

// Run the requester
main().catch(console.error);
