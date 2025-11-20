#!/usr/bin/env ts-node
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

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
 * Send log message with hierarchical routing key: service.severity
 */
async function sendLog(service: string, severity: string, message: string): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
        const connectionUrl = 'amqp://admin:password@localhost:5672/';
        connection = await amqp.connect(connectionUrl);
        channel = await connection.createChannel();

        // Declare topic exchange for logs
        const exchangeName = 'logs_aggregation';
        await channel.assertExchange(exchangeName, 'topic', {
            durable: true
        });

        // Routing key format: <service>.<severity>
        const routingKey = `${service}.${severity}`;

        const logEntry: LogEntry = {
            service,
            severity,
            message,
            timestamp: new Date().toISOString(),
            routing_key: routingKey
        };

        channel.publish(
            exchangeName,
            routingKey,
            Buffer.from(JSON.stringify(logEntry)),
            {
                persistent: true,
                contentType: 'application/json'
            }
        );

        console.log(`✓ Sent [${routingKey}]: ${message}`);

    } catch (error) {
        console.error('Error sending log:', error);
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

/**
 * Generate sample log messages
 */
async function generateSampleLogs(): Promise<void> {
    const services = ['auth', 'payment', 'inventory', 'notification'];
    const severities = ['debug', 'info', 'warning', 'error', 'critical'];

    const messages: Record<string, string[]> = {
        auth: ['User login successful', 'Invalid password attempt', 'Token expired'],
        payment: ['Payment processed', 'Card declined', 'Payment gateway timeout'],
        inventory: ['Stock updated', 'Low inventory warning', 'Inventory sync failed'],
        notification: ['Email sent', 'SMS delivery failed', 'Push notification queued']
    };

    for (let i = 0; i < 10; i++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const message = messages[service][Math.floor(Math.random() * messages[service].length)];

        await sendLog(service, severity, message);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length >= 3) {
        const [service, severity, ...messageParts] = args;
        const message = messageParts.join(' ');

        sendLog(service, severity, message).catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
    } else {
        console.log('Generating sample logs...');
        generateSampleLogs().catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
    }
}

export { sendLog, generateSampleLogs, LogEntry };
