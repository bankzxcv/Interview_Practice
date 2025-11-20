import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Request payload interface
 */
interface UserRequest {
  user_id?: number;
}

/**
 * Success response interface
 */
interface SuccessResponse {
  user_id: number;
  name: string;
  email: string;
  status: 'success';
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  status: 'error' | 'not_found';
}

type UserResponse = SuccessResponse | ErrorResponse;

/**
 * Robust responder with error handling and validation
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Robust User Service - Started\n');

  const sc = StringCodec();

  try {
    const sub: Subscription = nc.subscribe('user.get');

    console.log('Waiting for requests...\n');

    for await (const msg: Msg of sub) {
      let response: UserResponse;

      try {
        // Parse request
        const requestData: string = sc.decode(msg.data);
        const request: UserRequest = JSON.parse(requestData);

        // Validate request
        if (request.user_id === undefined) {
          response = {
            error: 'Missing required field: user_id',
            status: 'error'
          };
          if (msg.reply) {
            msg.respond(sc.encode(JSON.stringify(response)));
          }
          continue;
        }

        const userId = request.user_id;

        // Validate user_id
        if (typeof userId !== 'number' || userId <= 0) {
          response = {
            error: 'Invalid user_id: must be positive integer',
            status: 'error'
          };
          if (msg.reply) {
            msg.respond(sc.encode(JSON.stringify(response)));
          }
          continue;
        }

        // Simulate database lookup
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate user not found
        if (userId > 1000) {
          response = {
            error: `User ${userId} not found`,
            status: 'not_found'
          };
          if (msg.reply) {
            msg.respond(sc.encode(JSON.stringify(response)));
          }
          continue;
        }

        // Success response
        response = {
          user_id: userId,
          name: `User ${userId}`,
          email: `user${userId}@example.com`,
          status: 'success'
        };

        if (msg.reply) {
          msg.respond(sc.encode(JSON.stringify(response)));
        }
        console.log(`✓ Processed user_id: ${userId}`);

      } catch (err) {
        // Handle JSON parse errors
        if (err instanceof SyntaxError) {
          response = {
            error: 'Invalid JSON in request',
            status: 'error'
          };
        } else {
          response = {
            error: `Internal server error: ${err.message}`,
            status: 'error'
          };
        }

        if (msg.reply) {
          msg.respond(sc.encode(JSON.stringify(response)));
        }
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

// Run the robust responder
main().catch(console.error);
