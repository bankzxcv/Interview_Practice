#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

/**
 * Log entry interface
 */
interface LogEntry {
    service: string;
    severity: string;
    message: string;
    timestamp: string;
    routing_key: string;
}

/**
 * ANSI color codes for severity levels
 */
const colors: Record<string, string> = {
    debug: '\x1b[36m',    // Cyan
    info: '\x1b[32m',     // Green
    warning: '\x1b[33m',  // Yellow
    error: '\x1b[31m',    // Red
    critical: '\x1b[35m'  // Magenta
};
const reset = '\x1b[0m';

/**
 * Consume logs matching routing patterns
 */
async function consumeLogs(patterns: string[], consumerName: string): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        const exchangeName = 'logs_aggregation';
        await channel.assertExchange(exchangeName, 'topic', {
            durable: true
        });

        // Create exclusive queue
        const queueResult = await channel.assertQueue('', { exclusive: true });
        const queueName = queueResult.queue;

        // Bind queue to each pattern
        console.log(`=== ${consumerName} ===`);
        for (const pattern of patterns) {
            await channel.bindQueue(queueName, exchangeName, pattern);
            console.log(`Listening to: ${pattern}`);
        }

        await channel.prefetch(1);

        console.log(`\n⏳ ${consumerName} waiting for logs. Press CTRL+C to exit\n`);

        // Start consuming
        await channel.consume(
            queueName,
            (msg: ConsumeMessage | null) => {
                if (msg !== null) {
                    try {
                        const logEntry: LogEntry = JSON.parse(msg.content.toString());
                        const color = colors[logEntry.severity] || '';

                        console.log(`${color}✓ [${logEntry.routing_key}] ${logEntry.message}${reset}`);
                        console.log(`  Service: ${logEntry.service} | Time: ${logEntry.timestamp}`);

                        channel!.ack(msg);
                    } catch (error) {
                        console.error('Error processing log:', error);
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
            console.log(`\n✓ ${consumerName} stopped`);
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
    // Predefined consumer profiles
    const profiles: Record<string, [string[], string]> = {
        errors: [['*.error', '*.critical'], 'Error Monitor'],
        auth: [['auth.*'], 'Auth Service Monitor'],
        critical: [['*.critical'], 'Critical Alerts'],
        payment: [['payment.#'], 'Payment Monitor'],
        all: [['#'], 'All Logs Monitor']
    };

    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: ts-node log_aggregation_consumer.ts <profile>');
        console.log('\nAvailable profiles:');
        for (const [name, [patterns, desc]] of Object.entries(profiles)) {
            console.log(`  ${name.padEnd(10)} - ${desc.padEnd(30)} - Patterns: ${JSON.stringify(patterns)}`);
        }
        process.exit(1);
    }

    const profile = args[0];
    const profileData = profiles[profile];

    if (profileData) {
        const [patterns, name] = profileData;
        consumeLogs(patterns, name).catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
    } else {
        // Custom patterns
        const patterns = args;
        consumeLogs(patterns, 'Custom Consumer').catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
    }
}

export { consumeLogs, LogEntry };
