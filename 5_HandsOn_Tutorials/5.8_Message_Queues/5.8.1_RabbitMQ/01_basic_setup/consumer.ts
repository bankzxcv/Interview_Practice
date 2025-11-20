#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Message interface for type safety
 */
interface HelloMessage {
    id: number;
    text: string;
    timestamp: string;
}

/**
 * Process received message
 */
async function processMessage(msg: ConsumeMessage): Promise<void> {
    try {
        const message: HelloMessage = JSON.parse(msg.content.toString());
        console.log(`✓ Received: ${JSON.stringify(message)}`);

        // Simulate processing (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`  Processed message #${message.id}`);
    } catch (error) {
        console.error('Error processing message:', error);
        throw error;
    }
}

/**
 * Consume messages from RabbitMQ queue
 */
async function consumeMessages(): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        // Connection parameters
        const connectionUrl = 'amqp://admin:password@localhost:5672/';

        // Establish connection
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare queue (ensures it exists)
        const queueName = 'hello';
        await channel.assertQueue(queueName, {
            durable: true
        });

        // Set QoS - only take 1 message at a time
        await channel.prefetch(1);

        console.log('⏳ Waiting for messages. To exit press CTRL+C');

        // Start consuming
        await channel.consume(
            queueName,
            async (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        await processMessage(msg);
                        // Acknowledge message after successful processing
                        channel!.ack(msg);
                    } catch (error) {
                        console.error('Error processing message:', error);
                        // Negative acknowledge - requeue the message
                        channel!.nack(msg, false, true);
                    }
                }
            },
            {
                noAck: false  // Manual acknowledgment
            }
        );

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n✓ Consumer stopped');
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

        // Clean up on error
        try {
            if (channel) await channel.close();
            if (connection) await connection.close();
        } catch (closeError) {
            console.error('Error closing connection:', closeError);
        }

        throw error;
    }
}

// Run the function
if (require.main === module) {
    consumeMessages().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { consumeMessages, HelloMessage };
