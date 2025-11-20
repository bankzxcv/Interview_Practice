#!/usr/bin/env ts-node
import axios, { AxiosInstance } from 'axios';

/**
 * Node information interface
 */
interface NodeInfo {
    name: string;
    running: boolean;
    mem_used: number;
    mem_limit: number;
    disk_free: number;
    uptime: number;
}

/**
 * Queue information interface
 */
interface QueueInfo {
    name: string;
    type: string;
    durable: boolean;
    messages: number;
    messages_ready: number;
    messages_unacknowledged: number;
    consumers: number;
    state: string;
}

/**
 * Connection information interface
 */
interface ConnectionInfo {
    name: string;
    peer_host: string;
    peer_port: number;
    state: string;
}

/**
 * Overview information interface
 */
interface OverviewInfo {
    cluster_name?: string;
    rabbitmq_version?: string;
    erlang_version?: string;
    message_stats?: {
        publish_details?: { rate: number };
        deliver_get_details?: { rate: number };
        ack_details?: { rate: number };
    };
}

/**
 * RabbitMQ Management API Client
 */
class RabbitMQManagementAPI {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(
        host: string = 'localhost',
        port: number = 15672,
        username: string = 'admin',
        password: string = 'password'
    ) {
        this.baseUrl = `http://${host}:${port}/api`;
        this.client = axios.create({
            baseURL: this.baseUrl,
            auth: {
                username,
                password
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Get cluster overview
     */
    async getOverview(): Promise<OverviewInfo> {
        const response = await this.client.get('/overview');
        return response.data;
    }

    /**
     * Get all nodes
     */
    async getNodes(): Promise<NodeInfo[]> {
        const response = await this.client.get('/nodes');
        return response.data;
    }

    /**
     * Get all queues in vhost
     */
    async getQueues(vhost: string = '/'): Promise<QueueInfo[]> {
        const vhostEncoded = vhost === '/' ? '%2F' : vhost;
        const response = await this.client.get(`/queues/${vhostEncoded}`);
        return response.data;
    }

    /**
     * Get specific queue details
     */
    async getQueue(queueName: string, vhost: string = '/'): Promise<QueueInfo> {
        const vhostEncoded = vhost === '/' ? '%2F' : vhost;
        const response = await this.client.get(`/queues/${vhostEncoded}/${queueName}`);
        return response.data;
    }

    /**
     * Get all connections
     */
    async getConnections(): Promise<ConnectionInfo[]> {
        const response = await this.client.get('/connections');
        return response.data;
    }

    /**
     * Get all channels
     */
    async getChannels(): Promise<any[]> {
        const response = await this.client.get('/channels');
        return response.data;
    }

    /**
     * Purge all messages from queue
     */
    async purgeQueue(queueName: string, vhost: string = '/'): Promise<boolean> {
        const vhostEncoded = vhost === '/' ? '%2F' : vhost;
        try {
            await this.client.delete(`/queues/${vhostEncoded}/${queueName}/contents`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check node health
     */
    async healthCheck(): Promise<{ status: string; status_code: number }> {
        try {
            const response = await this.client.get('/health/checks/alarms');
            return {
                status: response.status === 200 ? 'healthy' : 'unhealthy',
                status_code: response.status
            };
        } catch (error: any) {
            return {
                status: 'unhealthy',
                status_code: error.response?.status || 0
            };
        }
    }
}

/**
 * Print comprehensive cluster status
 */
async function printClusterStatus(): Promise<void> {
    const api = new RabbitMQManagementAPI();

    console.log('='.repeat(80));
    console.log('RabbitMQ Cluster Status Report');
    console.log('='.repeat(80));
    console.log();

    try {
        // Overview
        const overview = await api.getOverview();
        console.log(`Cluster Name: ${overview.cluster_name || 'N/A'}`);
        console.log(`RabbitMQ Version: ${overview.rabbitmq_version || 'N/A'}`);
        console.log(`Erlang Version: ${overview.erlang_version || 'N/A'}`);
        console.log();

        // Message rates
        const msgStats = overview.message_stats || {};
        console.log('Message Rates (global):');
        console.log(`  Publish rate: ${(msgStats.publish_details?.rate || 0).toFixed(2)} msg/s`);
        console.log(`  Deliver rate: ${(msgStats.deliver_get_details?.rate || 0).toFixed(2)} msg/s`);
        console.log(`  Ack rate: ${(msgStats.ack_details?.rate || 0).toFixed(2)} msg/s`);
        console.log();

        // Nodes
        const nodes = await api.getNodes();
        console.log(`Nodes (${nodes.length}):`);
        for (const node of nodes) {
            const status = node.running ? '✓' : '✗';
            const memUsedGB = node.mem_used / (1024 ** 3);
            const memLimitGB = node.mem_limit / (1024 ** 3);
            const memPct = (memUsedGB / memLimitGB * 100) || 0;

            console.log(`  ${status} ${node.name}`);
            console.log(`    Memory: ${memUsedGB.toFixed(2)}GB / ${memLimitGB.toFixed(2)}GB (${memPct.toFixed(1)}%)`);
            console.log(`    Disk Free: ${(node.disk_free / (1024 ** 3)).toFixed(2)}GB`);
            console.log(`    Uptime: ${(node.uptime / 1000).toFixed(0)}s`);
        }
        console.log();

        // Queues
        const queues = await api.getQueues();
        console.log(`Queues (${queues.length}):`);
        for (const queue of queues.slice(0, 10)) {  // Show first 10
            const status = (queue.consumers === 0 && queue.messages > 0) ? '⚠' : '✓';

            console.log(`  ${status} ${queue.name}`);
            console.log(`    Messages: ${queue.messages} (Ready: ${queue.messages_ready}, Unacked: ${queue.messages_unacknowledged})`);
            console.log(`    Consumers: ${queue.consumers}`);
            console.log(`    State: ${queue.state}`);
        }
        console.log();

        // Connections
        const connections = await api.getConnections();
        const channels = await api.getChannels();
        console.log(`Connections: ${connections.length}`);
        console.log(`Channels: ${channels.length}`);
        console.log();

        // Health check
        const health = await api.healthCheck();
        console.log(`Health Status: ${health.status}`);
        console.log();

    } catch (error) {
        console.error('Error fetching cluster status:', error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    printClusterStatus().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export {
    RabbitMQManagementAPI,
    NodeInfo,
    QueueInfo,
    ConnectionInfo,
    OverviewInfo,
    printClusterStatus
};
