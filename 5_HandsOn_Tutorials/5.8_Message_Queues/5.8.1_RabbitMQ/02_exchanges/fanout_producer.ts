#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

/**
 * Broadcast message interface
 */
interface BroadcastMessage {
    message: string;
    timestamp: string;
}

/**
 * Broadcast message to all queues bound to fanout exchange
 */
async function broadcastMessage(messageText: string): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare fanout exchange
        const exchangeName = 'notifications';
        await channel.assertExchange(exchangeName, 'fanout', {
            durable: true
        });

        const message: BroadcastMessage = {
            message: messageText,
            timestamp: new Date().toISOString()
        };

        // Routing key is ignored for fanout exchanges
        channel.publish(
            exchangeName,
            '',  // routing key ignored
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,
                contentType: 'application/json'
            }
        );

        console.log(`✓ Broadcasted: ${messageText}`);

    } catch (error) {
        console.error('Error broadcasting message:', error);
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
        console.log('Usage: ts-node fanout_producer.ts <message>');
        console.log('Example: ts-node fanout_producer.ts "System maintenance in 10 minutes"');
        process.exit(1);
    }

    const message = args.join(' ');

    broadcastMessage(message).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { broadcastMessage, BroadcastMessage };
