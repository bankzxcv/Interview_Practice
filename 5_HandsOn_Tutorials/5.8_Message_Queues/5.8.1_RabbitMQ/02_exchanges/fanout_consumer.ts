#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Broadcast message interface
 */
interface BroadcastMessage {
    message: string;
    timestamp: string;
}

/**
 * Consume broadcast messages from fanout exchange
 */
async function consumeBroadcasts(consumerId: string): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare exchange
        const exchangeName = 'notifications';
        await channel.assertExchange(exchangeName, 'fanout', {
            durable: true
        });

        // Create exclusive queue (unique per consumer)
        const queueResult = await channel.assertQueue('', { exclusive: true });
        const queueName = queueResult.queue;

        // Bind to fanout exchange (no routing key needed)
        await channel.bindQueue(queueName, exchangeName, '');

        console.log(`Consumer ${consumerId} bound to notifications exchange`);

        await channel.prefetch(1);

        console.log('⏳ Waiting for broadcasts. Press CTRL+C to exit');

        // Start consuming
        await channel.consume(
            queueName,
            (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        const message: BroadcastMessage = JSON.parse(msg.content.toString());
                        console.log(`✓ [Consumer ${consumerId}] Received: ${message.message}`);
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
    const consumerId = args[0] || '1';

    consumeBroadcasts(consumerId).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { consumeBroadcasts, BroadcastMessage };
