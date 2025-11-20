#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

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
 * Publish messages to federated exchange
 */
async function publishToFederatedExchange(
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

        const exchangeName = 'federated_exchange';

        console.log(`\nPublishing to ${brokerName} (${host}:${port})`);
        console.log(`Exchange: ${exchangeName}\n`);

        for (let i = 1; i <= 10; i++) {
            const message: FederatedMessage = {
                id: i,
                source: brokerName,
                text: `Federated message #${i} from ${brokerName}`,
                timestamp: new Date().toISOString()
            };

            const routingKey = `test.${brokerName}.message`;

            channel.publish(
                exchangeName,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                {
                    persistent: true,
                    contentType: 'application/json'
                }
            );

            console.log(`✓ Sent: ${message.text}`);

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`\n✓ Published 10 messages to ${brokerName}\n`);

    } catch (error) {
        console.error('Error publishing messages:', error);
        throw error;
    } finally {
        try {
            if (channel) await channel.close();
            if (connection) await connection.close();
        } catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: ts-node federation_publisher.ts [west|east|central]');
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

    publishToFederatedExchange(
        brokerConfig.name,
        brokerConfig.host,
        brokerConfig.port
    ).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { publishToFederatedExchange, FederatedMessage, BrokerConfig };
