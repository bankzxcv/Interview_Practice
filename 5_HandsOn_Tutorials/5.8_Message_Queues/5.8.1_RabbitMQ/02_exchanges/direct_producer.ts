#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

/**
 * Log message interface
 */
interface LogMessage {
    severity: string;
    message: string;
    timestamp: string;
}

/**
 * Send message to direct exchange with severity routing key
 */
async function sendDirectMessage(severity: string, messageText: string): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare direct exchange
        const exchangeName = 'logs_direct';
        await channel.assertExchange(exchangeName, 'direct', {
            durable: true,
            autoDelete: false
        });

        const message: LogMessage = {
            severity,
            message: messageText,
            timestamp: new Date().toISOString()
        };

        // Publish with routing key = severity
        channel.publish(
            exchangeName,
            severity,  // routing key
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,
                contentType: 'application/json'
            }
        );

        console.log(`✓ Sent [${severity}]: ${messageText}`);

    } catch (error) {
        console.error('Error sending message:', error);
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

    if (args.length < 2) {
        console.log('Usage: ts-node direct_producer.ts <severity> <message>');
        console.log('Example: ts-node direct_producer.ts error "Database connection failed"');
        process.exit(1);
    }

    const severity = args[0];
    const message = args.slice(1).join(' ');

    sendDirectMessage(severity, message).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { sendDirectMessage, LogMessage };
