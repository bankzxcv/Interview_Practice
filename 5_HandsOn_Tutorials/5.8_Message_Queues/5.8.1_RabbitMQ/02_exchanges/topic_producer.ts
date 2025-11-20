#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

/**
 * Topic message interface
 */
interface TopicMessage {
    routing_key: string;
    message: string;
    timestamp: string;
}

/**
 * Send message to topic exchange with pattern-based routing key
 */
async function sendTopicMessage(routingKey: string, messageText: string): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare topic exchange
        const exchangeName = 'logs_topic';
        await channel.assertExchange(exchangeName, 'topic', {
            durable: true
        });

        const message: TopicMessage = {
            routing_key: routingKey,
            message: messageText,
            timestamp: new Date().toISOString()
        };

        channel.publish(
            exchangeName,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,
                contentType: 'application/json'
            }
        );

        console.log(`✓ Sent [${routingKey}]: ${messageText}`);

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
        console.log('Usage: ts-node topic_producer.ts <routing.key> <message>');
        console.log('Examples:');
        console.log('  ts-node topic_producer.ts kern.critical "System crash"');
        console.log('  ts-node topic_producer.ts app.error "Database error"');
        console.log('  ts-node topic_producer.ts app.info "User logged in"');
        process.exit(1);
    }

    const routingKey = args[0];
    const message = args.slice(1).join(' ');

    sendTopicMessage(routingKey, message).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { sendTopicMessage, TopicMessage };
