// verify-install.ts
import { PubSub } from '@google-cloud/pubsub';

/**
 * Verify @google-cloud/pubsub installation
 */
function verifyInstallation(): void {
  const pubsub = new PubSub();

  console.log('✓ @google-cloud/pubsub is installed');
  console.log('✓ PubSub client available');
  console.log(`✓ Client configuration: ${JSON.stringify(pubsub.options)}`);
}

if (require.main === module) {
  verifyInstallation();
}

export { verifyInstallation };
