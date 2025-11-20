#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Death information interface
 */
interface DeathInfo {
    queue?: string;
    reason?: string;
    count?: number;
    exchange?: string;
    'routing-keys'?: string[];
    time?: number;
}

/**
 * Monitor and log dead letter queue messages
 */
async function monitorDLQ(queueName: string = 'final_dead_letter_queue'): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        await channel.prefetch(1);

        console.log('=== Dead Letter Queue Monitor ===');
        console.log(`Queue: ${queueName}`);
        console.log('⏳ Monitoring for dead letters. Press CTRL+C to exit\n');

        // Start consuming
        await channel.consume(
            queueName,
            (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        const message = JSON.parse(msg.content.toString());

                        console.log('\n' + '='.repeat(60));
                        console.log('⚠️  DEAD LETTER RECEIVED');
                        console.log('='.repeat(60));
                        console.log(`Message: ${JSON.stringify(message, null, 2)}`);
                        console.log('\nDeath Information:');

                        // Extract death history
                        if (msg.properties.headers && msg.properties.headers['x-death']) {
                            const deaths = Array.isArray(msg.properties.headers['x-death'])
                                ? msg.properties.headers['x-death']
                                : [msg.properties.headers['x-death']];

                            deaths.forEach((death: DeathInfo, i: number) => {
                                console.log(`\nDeath #${i + 1}:`);
                                console.log(`  Queue: ${death.queue || 'N/A'}`);
                                console.log(`  Reason: ${death.reason || 'N/A'}`);
                                console.log(`  Count: ${death.count || 'N/A'}`);
                                console.log(`  Exchange: ${death.exchange || 'N/A'}`);
                                console.log(`  Routing Keys: ${JSON.stringify(death['routing-keys'] || [])}`);
                                if (death.time) {
                                    const timestamp = new Date(death.time * 1000);
                                    console.log(`  Time: ${timestamp.toISOString()}`);
                                }
                            });
                        }

                        console.log('\nOriginal Properties:');
                        console.log(`  Delivery Mode: ${msg.properties.deliveryMode}`);
                        console.log(`  Content Type: ${msg.properties.contentType}`);

                        // Acknowledge the dead letter
                        channel!.ack(msg);

                        console.log('\n✓ Dead letter logged and acknowledged');

                    } catch (error) {
                        console.error('Error processing dead letter:', error);
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
            console.log('\n✓ Monitor stopped');
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
        console.error('Error setting up monitor:', error);

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
    const queueName = args[0] || 'final_dead_letter_queue';

    monitorDLQ(queueName).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { monitorDLQ, DeathInfo };
