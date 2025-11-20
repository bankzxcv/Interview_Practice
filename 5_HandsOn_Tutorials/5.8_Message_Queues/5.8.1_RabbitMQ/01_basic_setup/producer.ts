#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

/**
 * Message interface for type safety
 */
interface HelloMessage {
    id: number;
    text: string;
    timestamp: string;
}

/**
 * Send messages to RabbitMQ queue
 */
async function sendMessages(): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        // Connection parameters
        const connectionUrl = 'amqp://admin:password@localhost:5672/';

        // Establish connection
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare queue (idempotent - safe to call multiple times)
        const queueName = 'hello';
        await channel.assertQueue(queueName, {
            durable: true,  // Survive broker restart
            exclusive: false,
            autoDelete: false
        });

        // Send 5 messages
        for (let i = 1; i <= 5; i++) {
            const message: HelloMessage = {
                id: i,
                text: `Hello World #${i}`,
                timestamp: new Date().toISOString()
            };

            const messageBuffer = Buffer.from(JSON.stringify(message));

            channel.sendToQueue(queueName, messageBuffer, {
                persistent: true,  // Make message persistent
                contentType: 'application/json'
            });

            console.log(`✓ Sent: ${JSON.stringify(message)}`);

            // Wait 1 second between messages
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✓ All messages sent successfully');

    } catch (error) {
        console.error('Error sending messages:', error);
        throw error;
    } finally {
        // Clean up resources
        try {
            if (channel) await channel.close();
            if (connection) await connection.close();
        } catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
    }
}

// Run the function
if (require.main === module) {
    sendMessages().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { sendMessages, HelloMessage };
