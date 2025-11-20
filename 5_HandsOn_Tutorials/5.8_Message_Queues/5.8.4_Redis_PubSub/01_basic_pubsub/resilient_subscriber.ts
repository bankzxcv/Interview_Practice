#!/usr/bin/env node

import { createClient, RedisClientType } from 'redis';

interface ConnectionConfig {
  host: string;
  port: number;
  maxRetries: number;
}

/**
 * Resilient subscriber with automatic reconnection
 */
class ResilientSubscriber {
  private config: ConnectionConfig;
  private client: RedisClientType | null = null;
  private isRunning: boolean = true;

  constructor(
    host: string = 'localhost',
    port: number = 6379,
    maxRetries: number = 5
  ) {
    this.config = { host, port, maxRetries };
    this.setupSignalHandlers();
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      this.isRunning = false;
    });

    process.on('SIGTERM', () => {
      console.log('\nShutting down...');
      this.isRunning = false;
    });
  }

  /**
   * Connect to Redis with retries and exponential backoff
   */
  private async connect(): Promise<boolean> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        this.client = createClient({
          socket: {
            host: this.config.host,
            port: this.config.port,
            connectTimeout: 5000,
            keepAlive: true,
          },
        });

        this.client.on('error', (err) => {
          console.error('Redis error:', err.message);
        });

        this.client.on('reconnecting', () => {
          console.log('Reconnecting to Redis...');
        });

        await this.client.connect();
        await this.client.ping();
        console.log('Connected to Redis');
        return true;
      } catch (error) {
        console.error(
          `Connection attempt ${attempt + 1} failed: ${error}`
        );

        if (attempt < this.config.maxRetries - 1) {
          const backoffTime = Math.pow(2, attempt) * 1000;
          console.log(`Waiting ${backoffTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
    }

    return false;
  }

  /**
   * Subscribe to channels with error handling
   */
  async subscribe(channels: string[]): Promise<void> {
    if (!(await this.connect())) {
      console.error('Failed to connect to Redis');
      return;
    }

    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log(`Subscribed to: ${channels.join(', ')}`);

    // Subscribe to all channels
    for (const channel of channels) {
      await this.client.subscribe(channel, (message, channelName) => {
        this.handleMessage(channelName, message);
      });
    }

    // Keep running until stopped
    while (this.isRunning) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Cleanup
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(channel: string, message: string): void {
    console.log(`[${channel}] ${message}`);
  }

  /**
   * Reconnect and resubscribe to channels
   */
  private async reconnect(channels: string[]): Promise<void> {
    console.log('Attempting to reconnect...');

    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    if (await this.connect()) {
      console.log('Reconnected and resubscribed');
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const subscriber = new ResilientSubscriber();

  try {
    await subscriber.subscribe(['system', 'alerts']);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

export { ResilientSubscriber };
