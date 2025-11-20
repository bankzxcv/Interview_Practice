#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

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
 * Consume messages from headers exchange based on header matching
 */
async function consumeByHeaders(
    matchHeaders: MessageHeaders,
    matchType: 'all' | 'any' = 'all'
): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare exchange
        const exchangeName = 'headers_exchange';
        await channel.assertExchange(exchangeName, 'headers', {
            durable: true
        });

        // Create exclusive queue
        const queueResult = await channel.assertQueue('', { exclusive: true });
        const queueName = queueResult.queue;

        // Prepare binding arguments with x-match
        const bindingArgs: MessageHeaders & { 'x-match': string } = {
            ...matchHeaders,
            'x-match': matchType
        };

        // Bind queue with header matching rules
        await channel.bindQueue(queueName, exchangeName, '', bindingArgs);

        console.log(`Bound with headers: ${JSON.stringify(matchHeaders)}`);
        console.log(`Match type: ${matchType}`);

        await channel.prefetch(1);

        console.log('\n⏳ Waiting for messages. Press CTRL+C to exit\n');

        // Start consuming
        await channel.consume(
            queueName,
            (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        const message: HeadersMessage = JSON.parse(msg.content.toString());
                        console.log(`✓ Received: ${message.message}`);
                        console.log(`  Headers: ${JSON.stringify(message.headers)}`);
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
    // Example: Match messages with format=pdf
    const matchHeaders: MessageHeaders = { format: 'pdf' };
    const matchType: 'all' | 'any' = 'all';

    console.log('Consuming messages with format=pdf');

    consumeByHeaders(matchHeaders, matchType).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { consumeByHeaders, HeadersMessage, MessageHeaders };
