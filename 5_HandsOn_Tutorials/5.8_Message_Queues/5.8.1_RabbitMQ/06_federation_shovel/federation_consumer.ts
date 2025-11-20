#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Federated message interface
 */
interface FederatedMessage {
    id: number;
    source: string;
    text: string;
    timestamp: string;
}

/**
 * Broker configuration interface
 */
interface BrokerConfig {
    name: string;
    host: string;
    port: number;
}

/**
 * Consume from federated exchange
 */
async function consumeFromFederatedExchange(
    brokerName: string,
    host: string,
    port: number
): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = `amqp://admin:password@${host}:${port}/`;
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Create exchange
        const exchangeName = 'federated_exchange';
        await channel.assertExchange(exchangeName, 'topic', {
            durable: true
        });

        // Create exclusive queue
        const queueResult = await channel.assertQueue('', { exclusive: true });
        const queueName = queueResult.queue;

        // Bind to all routing keys
        await channel.bindQueue(queueName, exchangeName, 'test.#');

        await channel.prefetch(1);

        console.log(`\n[${brokerName}] Waiting for federated messages...`);
        console.log(`Connected to ${host}:${port}`);
        console.log('Press CTRL+C to exit\n');

        // Start consuming
        await channel.consume(
            queueName,
            (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        const message: FederatedMessage = JSON.parse(msg.content.toString());
                        console.log(`[${brokerName}] Received from ${message.source}: ${message.text}`);
                        channel!.ack(msg);
                    } catch (error) {
                        console.error('Error processing message:', error);
                        channel!.nack(msg, false, false);
                    }
                }
            },
            {
                noAck: false
            }
        );

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log(`\n✓ ${brokerName} consumer stopped`);
            try {
                if (channel) await channel.close();
                if (connection) await connection.close();
                process.exit(0);
            } catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('Error setting up consumer:', error);

        try {
            if (channel) await channel.close();
            if (connection) await connection.close();
        } catch (closeError) {
            console.error('Error closing connection:', closeError);
        }

        throw error;
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: ts-node federation_consumer.ts [west|east|central]');
        process.exit(1);
    }

    const broker = args[0].toLowerCase();

    const brokers: Record<string, BrokerConfig> = {
        west: { name: 'west', host: 'localhost', port: 5672 },
        east: { name: 'east', host: 'localhost', port: 5673 },
        central: { name: 'central', host: 'localhost', port: 5674 }
    };

    const brokerConfig = brokers[broker];

    if (!brokerConfig) {
        console.log(`Invalid broker. Choose: ${Object.keys(brokers).join(', ')}`);
        process.exit(1);
    }

    consumeFromFederatedExchange(
        brokerConfig.name,
        brokerConfig.host,
        brokerConfig.port
    ).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { consumeFromFederatedExchange, FederatedMessage, BrokerConfig };
