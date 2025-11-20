import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';
import * as crypto from 'crypto';

/**
 * Authentication request interface
 */
interface AuthRequest {
  username: string;
  password: string;
}

/**
 * Authentication response interface
 */
interface AuthResponse {
  authenticated: boolean;
  username?: string;
  token?: string;
  error?: string;
}

/**
 * Fake user database
 */
const USERS: Record<string, string> = {
  'admin': 'password123',
  'user1': 'secret',
};

/**
 * Authentication service
 * Handles login requests on 'auth.login' subject
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Auth Service - Started');
  console.log('Listening on: auth.login\n');

  const sc = StringCodec();

  try {
    const sub: Subscription = nc.subscribe('auth.login');

    for await (const msg: Msg of sub) {
      const requestData: string = sc.decode(msg.data);
      const request: AuthRequest = JSON.parse(requestData);

      console.log(`Auth request: ${request.username}`);

      let response: AuthResponse;

      // Verify credentials
      if (request.username in USERS && USERS[request.username] === request.password) {
        // Generate token (simple hash for demo)
        const token = crypto
          .createHash('sha256')
          .update(request.username)
          .digest('hex')
          .substring(0, 16);

        response = {
          authenticated: true,
          username: request.username,
          token: token
        };
      } else {
        response = {
          authenticated: false,
          error: 'Invalid credentials'
        };
      }

      // Send response
      if (msg.reply) {
        msg.respond(sc.encode(JSON.stringify(response)));
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

// Run the auth service
main().catch(console.error);
