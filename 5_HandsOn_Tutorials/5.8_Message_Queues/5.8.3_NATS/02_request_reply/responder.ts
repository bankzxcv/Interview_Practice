import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

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
 * Basic request-reply responder (server)
 * Listens for requests on 'user.get' and sends responses
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('User Service - Responder started');
  console.log('Listening on: user.get\n');

  const sc = StringCodec();

  try {
    // Subscribe to request subject
    const sub: Subscription = nc.subscribe('user.get');

    console.log('Waiting for requests (Ctrl+C to exit)...\n');

    // Process requests
    for await (const msg: Msg of sub) {
      // Parse request
      const requestData: string = sc.decode(msg.data);
      const request: UserRequest = JSON.parse(requestData);

      console.log(`\n[Request] Subject: ${msg.subject}`);
      console.log(`  Data: ${JSON.stringify(request)}`);
      console.log(`  Reply to: ${msg.reply}`);

      // Simulate database lookup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create response
      const response: UserResponse = {
        user_id: request.user_id,
        name: `User ${request.user_id}`,
        email: `user${request.user_id}@example.com`,
        status: 'active'
      };

      // Send reply
      if (msg.reply) {
        msg.respond(sc.encode(JSON.stringify(response)));
        console.log('  [Response sent]');
      }
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error('Error:', err);
    }
  } finally {
    await nc.close();
    console.log('\nConnection closed');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

// Run the responder
main().catch(console.error);
