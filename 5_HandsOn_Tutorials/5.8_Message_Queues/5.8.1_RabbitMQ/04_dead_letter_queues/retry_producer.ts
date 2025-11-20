#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

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
 * Send message to processing queue with retry metadata
 */
async function sendForProcessing(messageText: string, failCount: number = 0): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        const message: RetryMessage = {
            text: messageText,
            timestamp: new Date().toISOString(),
            retry_count: 0,
            fail_until_count: failCount
        };

        channel.sendToQueue(
            'retry_processing_queue',
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,
                contentType: 'application/json',
                headers: { 'x-retry-count': 0 }
            }
        );

        console.log(`✓ Sent: ${messageText}`);
        console.log(`  Will fail ${failCount} times before succeeding`);

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

    if (args.length < 1) {
        console.log('Usage: ts-node retry_producer.ts <message> [fail_count]');
        console.log('\nExamples:');
        console.log('  ts-node retry_producer.ts "Success message" 0    # Succeeds immediately');
        console.log('  ts-node retry_producer.ts "Retry once" 1         # Fails once, succeeds on retry');
        console.log('  ts-node retry_producer.ts "Retry twice" 2        # Fails twice, succeeds on 3rd');
        console.log('  ts-node retry_producer.ts "Always fails" 10      # Goes to DLQ after 3 retries');
        process.exit(1);
    }

    const message = args[0];
    const failCount = args.length > 1 ? parseInt(args[1], 10) : 0;

    sendForProcessing(message, failCount).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { sendForProcessing, RetryMessage };
