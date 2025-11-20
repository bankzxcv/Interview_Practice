#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

/**
 * Message headers interface
 */
interface MessageHeaders {
    [key: string]: string;
}

/**
 * Headers message interface
 */
interface HeadersMessage {
    headers: MessageHeaders;
    message: string;
    timestamp: string;
}

/**
 * Send message to headers exchange with custom headers
 */
async function sendWithHeaders(headers: MessageHeaders, messageText: string): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare headers exchange
        const exchangeName = 'headers_exchange';
        await channel.assertExchange(exchangeName, 'headers', {
            durable: true
        });

        const message: HeadersMessage = {
            headers,
            message: messageText,
            timestamp: new Date().toISOString()
        };

        // Publish with headers (routing key is ignored for headers exchange)
        channel.publish(
            exchangeName,
            '',  // routing key ignored
            Buffer.from(JSON.stringify(message)),
            {
                headers,
                persistent: true,
                contentType: 'application/json'
            }
        );

        console.log(`✓ Sent with headers ${JSON.stringify(headers)}: ${messageText}`);

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
    // Example headers and messages
    const examples: Record<string, [MessageHeaders, string]> = {
        '1': [{ format: 'pdf', type: 'report' }, 'Q1 Financial Report'],
        '2': [{ format: 'json', type: 'log' }, 'Application logs'],
        '3': [{ format: 'xml', type: 'config' }, 'System configuration'],
    };

    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: ts-node headers_producer.ts <example_number>');
        console.log('\nExamples:');
        for (const [key, [headers, msg]] of Object.entries(examples)) {
            console.log(`  ${key}: ${JSON.stringify(headers)} -> '${msg}'`);
        }
        process.exit(1);
    }

    const choice = args[0];
    const example = examples[choice];

    if (example) {
        const [headers, message] = example;
        sendWithHeaders(headers, message).catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
    } else {
        console.log(`Invalid choice. Choose from: ${Object.keys(examples).join(', ')}`);
        process.exit(1);
    }
}

export { sendWithHeaders, HeadersMessage, MessageHeaders };
