import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * User request with authentication token
 */
interface UserRequest {
  token: string;
  user_id: number;
}

/**
 * Token verification request
 */
interface AuthCheckRequest {
  token: string;
}

/**
 * Token verification response
 */
interface AuthCheckResponse {
  valid: boolean;
}

/**
 * User response
 */
interface UserResponse {
  user_id?: number;
  name?: string;
  email?: string;
  error?: string;
}

/**
 * User service with authentication
 * Verifies token with auth service before returning user data
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('User Service - Started');
  console.log('Listening on: user.get\n');

  const sc = StringCodec();

  try {
    const sub: Subscription = nc.subscribe('user.get');

    for await (const msg: Msg of sub) {
      const requestData: string = sc.decode(msg.data);
      const request: UserRequest = JSON.parse(requestData);

      let response: UserResponse;

      try {
        // Verify token by calling auth service
        const authCheck: AuthCheckRequest = { token: request.token };

        const authResponse = await nc.request(
          'auth.verify',
          sc.encode(JSON.stringify(authCheck)),
          { timeout: 1000 }
        );

        const authData: AuthCheckResponse = JSON.parse(sc.decode(authResponse.data));

        if (!authData.valid) {
          response = { error: 'Unauthorized' };
          if (msg.reply) {
            msg.respond(sc.encode(JSON.stringify(response)));
          }
          continue;
        }

        // Return user data
        response = {
          user_id: request.user_id,
          name: `User ${request.user_id}`,
          email: `user${request.user_id}@example.com`
        };

        if (msg.reply) {
          msg.respond(sc.encode(JSON.stringify(response)));
        }

      } catch (err) {
        if (err.code === 'TIMEOUT' || err.code === '503') {
          response = { error: 'Auth service unavailable' };
        } else {
          response = { error: `Internal error: ${err.message}` };
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

// Run the user service
main().catch(console.error);
