#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Retry message interface
 */
interface RetryMessage {
    text: string;
    timestamp: string;
    retry_count: number;
    fail_until_count: number;
}

/**
 * Process message with retry logic
 * Simulates failures based on message metadata to demonstrate retry behavior
 */
async function processMessage(
    msg: ConsumeMessage,
    channel: Channel
): Promise<void> {
    try {
        const message: RetryMessage = JSON.parse(msg.content.toString());

        // Get retry count from headers
        let retryCount = 0;
        if (msg.properties.headers && msg.properties.headers['x-retry-count'] !== undefined) {
            retryCount = msg.properties.headers['x-retry-count'];
        }

        // Get death history count
        let deaths = 0;
        if (msg.properties.headers && msg.properties.headers['x-death']) {
            deaths = Array.isArray(msg.properties.headers['x-death'])
                ? msg.properties.headers['x-death'].length
                : 1;
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Processing message: ${message.text}`);
        console.log(`Retry count: ${retryCount}`);
        console.log(`Death count: ${deaths}`);
        console.log(`Timestamp: ${message.timestamp}`);

        // Simulate processing failure
        const failUntil = message.fail_until_count || 0;

        if (deaths < failUntil) {
            console.log(`❌ Processing FAILED (simulated failure ${deaths + 1}/${failUntil})`);
            console.log('→ Message will be retried with exponential backoff');

            // Reject message - will be dead-lettered to wait queue
            channel.nack(msg, false, false);
        } else {
            console.log('✓ Processing SUCCESSFUL');
            if (deaths > 0) {
                console.log(`  (succeeded after ${deaths} retries)`);
            }

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Acknowledge successful processing
            channel.ack(msg);
        }

    } catch (error) {
        console.error('Error processing message:', error);
        channel.nack(msg, false, false);
    }
}

/**
 * Consume messages from retry processing queue
 */
async function consumeWithRetry(): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        const queueName = 'retry_processing_queue';

        await channel.prefetch(1);

        console.log('=== Retry Consumer ===');
        console.log('⏳ Waiting for messages. Press CTRL+C to exit\n');

        // Start consuming
        await channel.consume(
            queueName,
            async (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    await processMessage(msg, channel!);
                }
            },
            {
                noAck: false
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
    consumeWithRetry().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { consumeWithRetry, RetryMessage };
