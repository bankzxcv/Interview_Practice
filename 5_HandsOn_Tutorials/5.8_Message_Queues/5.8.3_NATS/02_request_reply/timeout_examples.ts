import { connect, NatsConnection, StringCodec } from 'nats';

/**
 * Timeout strategies example
 * Demonstrates different approaches to handling timeouts
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  const sc = StringCodec();

  try {
    // Strategy 1: Fixed timeout
    console.log('\n1. Fixed timeout (2 seconds)');
    try {
      const response = await nc.request(
        'slow.service',
        sc.encode('request'),
        { timeout: 2000 }
      );
      console.log('  Response received');
    } catch (err) {
      if (err.code === 'TIMEOUT' || err.code === '503') {
        console.log('  Timeout occurred');
      }
    }

    // Strategy 2: Retry with exponential backoff
    console.log('\n2. Retry with exponential backoff');
    let success = false;
    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      const timeout = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      console.log(`  Attempt ${attempt + 1} (timeout: ${timeout / 1000}s)`);

      try {
        const response = await nc.request(
          'user.get',
          sc.encode('{"user_id": 1}'),
          { timeout }
        );
        console.log('  Success!');
        success = true;
      } catch (err) {
        if (err.code === 'TIMEOUT' || err.code === '503') {
          console.log('  Timeout');
          if (attempt === 2) {
            console.log('  Max retries reached');
          }
        }
      }
    }

    // Strategy 3: Fallback response
    console.log('\n3. Fallback response on timeout');
    let data: any;
    try {
      const response = await nc.request(
        'user.get',
        sc.encode('{"user_id": 1}'),
        { timeout: 1000 }
      );
      data = JSON.parse(sc.decode(response.data));
    } catch (err) {
      if (err.code === 'TIMEOUT' || err.code === '503') {
        console.log('  Using cached/default response');
        data = { user_id: 1, name: 'Default User', cached: true };
      }
    }

    console.log(`  Result: ${JSON.stringify(data)}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the timeout examples
main().catch(console.error);
