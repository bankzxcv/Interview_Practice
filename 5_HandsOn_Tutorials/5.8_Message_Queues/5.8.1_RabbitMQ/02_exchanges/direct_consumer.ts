#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Log message interface
 */
interface LogMessage {
    severity: string;
    message: string;
    timestamp: string;
}

/**
 * Consume messages from direct exchange filtered by severity
 */
async function consumeDirectMessages(severities: string[]): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare exchange
        const exchangeName = 'logs_direct';
        await channel.assertExchange(exchangeName, 'direct', {
            durable: true
        });

        // Create exclusive queue
        const queueResult = await channel.assertQueue('', { exclusive: true });
        const queueName = queueResult.queue;

        // Bind queue for each severity
        for (const severity of severities) {
            await channel.bindQueue(queueName, exchangeName, severity);
            console.log(`Bound to severity: ${severity}`);
        }

        await channel.prefetch(1);

        console.log(`\n⏳ Waiting for ${severities.join(', ')} messages. Press CTRL+C to exit\n`);

        // Start consuming
        await channel.consume(
            queueName,
            (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        const message: LogMessage = JSON.parse(msg.content.toString());
                        console.log(`✓ [${message.severity}] ${message.message}`);
                        console.log(`  Timestamp: ${message.timestamp}`);
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
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: ts-node direct_consumer.ts <severity1> [severity2] ...');
        console.log('Example: ts-node direct_consumer.ts error warning');
        process.exit(1);
    }

    const severities = args;
    consumeDirectMessages(severities).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { consumeDirectMessages, LogMessage };
