#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Topic message interface
 */
interface TopicMessage {
    routing_key: string;
    message: string;
    timestamp: string;
}

/**
 * Consume messages from topic exchange with pattern matching
 */
async function consumeTopicMessages(bindingKeys: string[]): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare exchange
        const exchangeName = 'logs_topic';
        await channel.assertExchange(exchangeName, 'topic', {
            durable: true
        });

        // Create exclusive queue
        const queueResult = await channel.assertQueue('', { exclusive: true });
        const queueName = queueResult.queue;

        // Bind queue with each pattern
        for (const bindingKey of bindingKeys) {
            await channel.bindQueue(queueName, exchangeName, bindingKey);
            console.log(`Bound to pattern: ${bindingKey}`);
        }

        await channel.prefetch(1);

        console.log(`\n⏳ Waiting for messages matching ${bindingKeys.join(', ')}. Press CTRL+C to exit\n`);

        // Start consuming
        await channel.consume(
            queueName,
            (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        const message: TopicMessage = JSON.parse(msg.content.toString());
                        console.log(`✓ [${msg.fields.routingKey}] ${message.message}`);
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
        console.log('Usage: ts-node topic_consumer.ts <pattern1> [pattern2] ...');
        console.log('Patterns:');
        console.log('  * (star) - matches exactly one word');
        console.log('  # (hash) - matches zero or more words');
        console.log('\nExamples:');
        console.log('  ts-node topic_consumer.ts "*.critical"       # All critical messages');
        console.log('  ts-node topic_consumer.ts "kern.*"          # All kernel messages');
        console.log('  ts-node topic_consumer.ts "app.#"           # All app messages');
        console.log('  ts-node topic_consumer.ts "#"               # All messages');
        process.exit(1);
    }

    const bindingKeys = args;
    consumeTopicMessages(bindingKeys).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { consumeTopicMessages, TopicMessage };
