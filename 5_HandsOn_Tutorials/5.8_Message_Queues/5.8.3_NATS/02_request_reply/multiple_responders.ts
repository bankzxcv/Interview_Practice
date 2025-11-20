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
  processed_by: string;
}

/**
 * Run a responder with a specific ID
 */
async function runResponder(responderId: string): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log(`[Responder ${responderId}] Started`);

  const sc = StringCodec();

  try {
    const sub: Subscription = nc.subscribe('user.get');

    for await (const msg: Msg of sub) {
      const requestData: string = sc.decode(msg.data);
      const request: UserRequest = JSON.parse(requestData);

      console.log(`[Responder ${responderId}] Processing user_id: ${request.user_id}`);

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create response
      const response: UserResponse = {
        user_id: request.user_id,
        name: `User ${request.user_id}`,
        processed_by: `Responder-${responderId}`
      };

      // Send reply
      if (msg.reply) {
        msg.respond(sc.encode(JSON.stringify(response)));
      }
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error(`[Responder ${responderId}] Error:`, err);
    }
  } finally {
    await nc.close();
  }
}

/**
 * Multiple responders example
 * NATS automatically load-balances requests across responders
 */
async function main(): Promise<void> {
  // Get responder ID from command line argument or default to '1'
  const responderId: string = process.argv[2] || '1';

  try {
    await runResponder(responderId);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  const responderId: string = process.argv[2] || '1';
  console.log(`\n[Responder ${responderId}] Shutting down`);
  process.exit(0);
});

// Run the responder
main().catch(console.error);
