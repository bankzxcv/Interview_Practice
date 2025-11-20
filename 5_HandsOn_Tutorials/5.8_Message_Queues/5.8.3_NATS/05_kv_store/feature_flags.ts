import { connect, NatsConnection, KV, StringCodec } from 'nats';

/**
 * Feature flag management with NATS KV
 */
class FeatureFlags {
  private nc: NatsConnection;
  private kv?: KV;
  private sc = StringCodec();

  constructor(nc: NatsConnection) {
    this.nc = nc;
  }

  async initialize(): Promise<void> {
    const js = this.nc.jetstream();

    // Get or create feature flags bucket
    try {
      this.kv = await js.views.kv('FEATURE_FLAGS');
    } catch {
      this.kv = await js.views.kv('FEATURE_FLAGS', {
        description: 'Feature flags',
        history: 10
      });
    }
  }

  async enable(featureName: string): Promise<void> {
    if (!this.kv) throw new Error('Not initialized');
    await this.kv.put(`feature.${featureName}`, this.sc.encode('enabled'));
    console.log(`✓ Enabled feature: ${featureName}`);
  }

  async disable(featureName: string): Promise<void> {
    if (!this.kv) throw new Error('Not initialized');
    await this.kv.put(`feature.${featureName}`, this.sc.encode('disabled'));
    console.log(`✗ Disabled feature: ${featureName}`);
  }

  async isEnabled(featureName: string): Promise<boolean> {
    if (!this.kv) throw new Error('Not initialized');

    try {
      const entry = await this.kv.get(`feature.${featureName}`);
      if (!entry || !entry.value) return false;
      return this.sc.decode(entry.value) === 'enabled';
    } catch {
      return false; // Default: disabled
    }
  }

  async listFeatures(): Promise<Record<string, boolean>> {
    if (!this.kv) throw new Error('Not initialized');

    const features: Record<string, boolean> = {};
    const keys = await this.kv.keys();

    for await (const key of keys) {
      if (key.startsWith('feature.')) {
        const featureName = key.replace('feature.', '');
        const enabled = await this.isEnabled(featureName);
        features[featureName] = enabled;
      }
    }

    return features;
  }
}

/**
 * Feature flags demo
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    const ff = new FeatureFlags(nc);
    await ff.initialize();

    console.log('Feature Flags System\n');

    // Enable features
    await ff.enable('dark_mode');
    await ff.enable('new_ui');
    await ff.enable('beta_api');

    // Disable one
    await ff.disable('beta_api');

    console.log('\n=== Feature Status ===\n');

    // Check features
    const darkMode = await ff.isEnabled('dark_mode');
    console.log(`Dark Mode: ${darkMode ? '✓ Enabled' : '✗ Disabled'}`);

    const newUi = await ff.isEnabled('new_ui');
    console.log(`New UI: ${newUi ? '✓ Enabled' : '✗ Disabled'}`);

    const betaApi = await ff.isEnabled('beta_api');
    console.log(`Beta API: ${betaApi ? '✓ Enabled' : '✗ Disabled'}`);

    // List all features
    console.log('\n=== All Features ===\n');
    const features = await ff.listFeatures();
    for (const [name, enabled] of Object.entries(features)) {
      const status = enabled ? '✓ Enabled' : '✗ Disabled';
      console.log(`  ${name}: ${status}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the feature flags demo
main().catch(console.error);
