#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Cluster host configuration interface
 */
interface ClusterHost {
    host: string;
    port: number;
}

/**
 * Cluster message interface
 */
interface ClusterMessage {
    id: number;
    text: string;
    timestamp: string;
    priority: number;
}

/**
 * Cluster-aware consumer with automatic reconnection
 */
class ClusterConsumer {
    private hosts: ClusterHost[];
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private shouldStop: boolean = false;

    constructor(hosts: ClusterHost[]) {
        this.hosts = hosts;

        // Setup signal handlers
        process.on('SIGINT', this.handleSignal.bind(this));
        process.on('SIGTERM', this.handleSignal.bind(this));
    }

    /**
     * Handle shutdown signals
     */
    private handleSignal(): void {
        console.log('\n✓ Shutting down gracefully...');
        this.shouldStop = true;
        if (this.channel) {
            this.channel.cancel('consumer-tag').catch(() => {});
        }
    }

    /**
     * Connect to RabbitMQ cluster
     */
    async connect(): Promise<boolean> {
        for (const host of this.hosts) {
            try {
                const connectionUrl = `amqp://admin:password@${host.host}:${host.port}/`;
                this.connection = await amqp.connect(connectionUrl, {
                    heartbeat: 60,
                });

                this.channel = await this.connection.createChannel();
                await this.channel.prefetch(1);

                console.log(`✓ Connected to ${host.host}:${host.port}`);
                return true;

            } catch (error) {
                console.log(`✗ Failed to connect to ${host.host}:${host.port}`);
                continue;
            }
        }

        return false;
    }

    /**
     * Process received message
     */
    private async processMessage(msg: ConsumeMessage): Promise<void> {
        try {
            const message: ClusterMessage = JSON.parse(msg.content.toString());
            console.log(`✓ Received: ${message.text} (ID: ${message.id})`);

            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 500));

            // Acknowledge message
            this.channel!.ack(msg);

        } catch (error) {
            console.error('✗ Error processing message:', error);
            // Negative acknowledge - don't requeue
            this.channel!.nack(msg, false, false);
        }
    }

    /**
     * Start consuming messages with auto-reconnect
     */
    async startConsuming(): Promise<void> {
        while (!this.shouldStop) {
            try {
                // Ensure connection
                if (!this.connection || !this.channel) {
                    const connected = await this.connect();
                    if (!connected) {
                        console.log('✗ Could not connect to any node, retrying in 5s...');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }
                }

                // Start consuming
                await this.channel!.consume(
                    'ha_queue',
                    async (msg: ConsumeMessage | null) => {
                        if (msg !== null) {
                            await this.processMessage(msg);
                        }
                    },
                    {
                        noAck: false,
                        consumerTag: 'consumer-tag'
                    }
                );

                console.log('⏳ Waiting for messages. Press CTRL+C to exit');

                // Wait for shutdown
                await new Promise<void>((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (this.shouldStop) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 1000);
                });

                break;

            } catch (error) {
                if (error instanceof Error && error.message.includes('Connection closed')) {
                    console.log('✗ Connection lost, reconnecting in 5 seconds...');
                    this.connection = null;
                    this.channel = null;
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    console.error('✗ Unexpected error:', error);
                    break;
                }
            }
        }
    }

    /**
     * Close connection
     */
    async close(): Promise<void> {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            console.log('✓ Connection closed');
        } catch (error) {
            console.error('Error closing connection:', error);
        }
    }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const clusterHosts: ClusterHost[] = [
        { host: 'localhost', port: 5671 },  // HAProxy
    ];

    const consumer = new ClusterConsumer(clusterHosts);

    try {
        await consumer.startConsuming();
    } finally {
        await consumer.close();
    }
}

// Run the function
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { ClusterConsumer, ClusterMessage, ClusterHost };
