// test-auth.ts
import { PubSub } from '@google-cloud/pubsub';

/**
 * Test authentication with GCP Pub/Sub
 */
async function testAuthentication(): Promise<boolean> {
  try {
    const pubsub = new PubSub();
    const projectId = await pubsub.getClientConfig().then(config => config.projectId);

    console.log('✓ Authentication successful!');
    console.log(`Project: ${projectId}`);
    return true;
  } catch (error) {
    console.error('✗ Authentication failed:', error);
    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  testAuthentication()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { testAuthentication };
