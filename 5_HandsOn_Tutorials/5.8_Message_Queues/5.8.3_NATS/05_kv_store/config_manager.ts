import { connect, NatsConnection, KV, StringCodec, KvWatcher } from 'nats';

/**
 * Distributed configuration manager using NATS KV
 */
class ConfigManager {
  private nc: NatsConnection;
  private bucketName: string;
  private kv?: KV;
  private cache: Map<string, any> = new Map();
  private watcher?: KvWatcher;
  private sc = StringCodec();

  constructor(nc: NatsConnection, bucketName: string = 'APP_CONFIG') {
    this.nc = nc;
    this.bucketName = bucketName;
  }

  async initialize(): Promise<void> {
    const js = this.nc.jetstream();

    // Get or create KV bucket
    try {
      this.kv = await js.views.kv(this.bucketName);
    } catch {
      this.kv = await js.views.kv(this.bucketName, { history: 5 });
    }

    // Start watching for changes
    this.watcher = await this.kv.watch({});
    this.watchChanges();
  }

  private async watchChanges(): Promise<void> {
    if (!this.watcher) return;

    for await (const entry of this.watcher) {
      if (!entry) continue;

      const key = entry.key;
      if (entry.value) {
        const value = this.sc.decode(entry.value);
        this.cache.set(key, value);
        console.log(`[CONFIG UPDATE] ${key} = ${value}`);
      } else {
        this.cache.delete(key);
        console.log(`[CONFIG DELETE] ${key}`);
      }
    }
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.kv) throw new Error('Not initialized');

    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await this.kv.put(key, this.sc.encode(strValue));
  }

  async get(key: string, defaultValue: any = null): Promise<any> {
    if (!this.kv) throw new Error('Not initialized');

    try {
      const entry = await this.kv.get(key);
      if (!entry || !entry.value) return defaultValue;

      const value = this.sc.decode(entry.value);

      // Try to parse as JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch {
      return defaultValue;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.kv) throw new Error('Not initialized');
    await this.kv.delete(key);
  }

  async getAll(): Promise<Record<string, any>> {
    if (!this.kv) throw new Error('Not initialized');

    const config: Record<string, any> = {};
    const keys = await this.kv.keys();

    for await (const key of keys) {
      const value = await this.get(key);
      config[key] = value;
    }

    return config;
  }

  async close(): Promise<void> {
    if (this.watcher) {
      this.watcher.stop();
    }
  }
}

/**
 * Config manager demo
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  try {
    // Create config manager
    const config = new ConfigManager(nc);
    await config.initialize();

    console.log('Configuration Manager initialized\n');

    // Set configuration values
    await config.set('database.host', 'localhost');
    await config.set('database.port', 5432);
    await config.set('features', { dark_mode: true, beta: false });
    await config.set('max_connections', 100);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get configuration values
    console.log('\n=== Reading Configuration ===\n');
    const dbHost = await config.get('database.host');
    console.log(`database.host: ${dbHost}`);

    const features = await config.get('features');
    console.log(`features: ${JSON.stringify(features)}`);

    // Get all config
    console.log('\n=== All Configuration ===\n');
    const allConfig = await config.getAll();
    for (const [key, value] of Object.entries(allConfig)) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }

    // Update value
    console.log('\n=== Updating Configuration ===\n');
    await config.set('max_connections', 200);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clean up
    await config.close();

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the config manager demo
main().catch(console.error);
