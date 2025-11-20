#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

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
 * Cluster-aware producer with automatic reconnection
 */
class ClusterProducer {
    private hosts: ClusterHost[];
    private connection: Connection | null = null;
    private channel: Channel | null = null;

    constructor(hosts: ClusterHost[]) {
        this.hosts = hosts;
    }

    /**
     * Connect to RabbitMQ cluster with retry
     */
    async connect(): Promise<void> {
        // Try each host until one connects
        for (const host of this.hosts) {
            try {
                const connectionUrl = `amqp://admin:password@${host.host}:${host.port}/`;
                this.connection = await amqp.connect(connectionUrl, {
                    heartbeat: 60,
                });

                this.channel = await this.connection.createChannel();

                console.log(`✓ Connected to ${host.host}:${host.port}`);
                return;

            } catch (error) {
                console.log(`✗ Failed to connect to ${host.host}:${host.port}`);
                continue;
            }
        }

        throw new Error('Could not connect to any RabbitMQ node');
    }

    /**
     * Send message with automatic reconnection
     */
    async sendMessage(
        exchange: string,
        routingKey: string,
        message: ClusterMessage,
        maxRetries: number = 3
    ): Promise<boolean> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Ensure connection is established
                if (!this.connection || !this.channel) {
                    await this.connect();
                }

                this.channel!.publish(
                    exchange,
                    routingKey,
                    Buffer.from(JSON.stringify(message)),
                    {
                        persistent: true,
                        contentType: 'application/json',
                        timestamp: Date.now()
                    }
                );

                return true;

            } catch (error) {
                console.error(`✗ Error sending message (attempt ${attempt + 1}):`, error);

                if (attempt < maxRetries - 1) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    try {
                        await this.connect();
                    } catch (connectError) {
                        // Continue to next attempt
                    }
                }
            }
        }

        return false;
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
    // Cluster nodes (HAProxy in this case, but could be direct nodes)
    const clusterHosts: ClusterHost[] = [
        { host: 'localhost', port: 5671 },  // HAProxy
    ];

    // Alternative: Direct connection to nodes
    // const clusterHosts: ClusterHost[] = [
    //     { host: 'localhost', port: 5672 },  // rabbit1
    //     { host: 'localhost', port: 5673 },  // rabbit2
    //     { host: 'localhost', port: 5674 },  // rabbit3
    // ];

    const producer = new ClusterProducer(clusterHosts);

    try {
        await producer.connect();
        console.log('\nSending messages to quorum queue...');

        for (let i = 1; i <= 100; i++) {
            const message: ClusterMessage = {
                id: i,
                text: `Cluster message #${i}`,
                timestamp: new Date().toISOString(),
                priority: Math.floor(Math.random() * 10) + 1
            };

            const success = await producer.sendMessage(
                'ha_exchange',
                'ha_route',
                message
            );

            if (success) {
                console.log(`✓ Sent message #${i}`);
            } else {
                console.log(`✗ Failed to send message #${i}`);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

    } catch (error) {
        if (error instanceof Error && error.message.includes('SIGINT')) {
            console.log('\n✓ Stopped by user');
        } else {
            console.error('Error:', error);
        }
    } finally {
        await producer.close();
    }
}

// Run the function
if (require.main === module) {
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n✓ Stopping...');
        process.exit(0);
    });

    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { ClusterProducer, ClusterMessage, ClusterHost };
