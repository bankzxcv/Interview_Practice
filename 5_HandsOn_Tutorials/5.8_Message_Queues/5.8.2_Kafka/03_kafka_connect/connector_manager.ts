#!/usr/bin/env ts-node
/**
 * Kafka Connect Manager - TypeScript Implementation
 * Manages connectors via REST API with proper typing
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface ConnectorConfig {
  [key: string]: string | number | boolean;
}

interface ConnectorInfo {
  name: string;
  config: ConnectorConfig;
  tasks: TaskInfo[];
  type: 'source' | 'sink';
}

interface TaskInfo {
  connector: string;
  task: number;
}

interface ConnectorStatus {
  name: string;
  connector: {
    state: string;
    worker_id: string;
  };
  tasks: Array<{
    id: number;
    state: string;
    worker_id: string;
  }>;
  type: string;
}

/**
 * Kafka Connect Manager Class
 */
class KafkaConnectManager {
  private client: AxiosInstance;
  private connectUrl: string;

  constructor(connectUrl: string = 'http://localhost:8083') {
    this.connectUrl = connectUrl;
    this.client = axios.create({
      baseURL: connectUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * List all deployed connectors
   */
  async listConnectors(): Promise<string[]> {
    try {
      const response: AxiosResponse<string[]> = await this.client.get('/connectors');
      const connectors = response.data;

      console.log(`\n📋 Active Connectors (${connectors.length}):`);
      connectors.forEach((connector) => {
        console.log(`  - ${connector}`);
      });

      return connectors;
    } catch (error) {
      console.error('❌ Error listing connectors:', error);
      throw error;
    }
  }

  /**
   * Get connector status
   */
  async getConnectorStatus(connectorName: string): Promise<ConnectorStatus> {
    try {
      const response: AxiosResponse<ConnectorStatus> = await this.client.get(
        `/connectors/${connectorName}/status`
      );
      const status = response.data;

      console.log(`\n📊 Connector: ${connectorName}`);
      console.log(`  State: ${status.connector.state}`);
      console.log(`  Worker: ${status.connector.worker_id}`);
      console.log(`\n  Tasks:`);
      status.tasks.forEach((task) => {
        console.log(`    Task ${task.id}: ${task.state}`);
      });

      return status;
    } catch (error) {
      console.error(`❌ Error getting status for ${connectorName}:`, error);
      throw error;
    }
  }

  /**
   * Pause a connector
   */
  async pauseConnector(connectorName: string): Promise<void> {
    try {
      await this.client.put(`/connectors/${connectorName}/pause`);
      console.log(`✓ Paused connector: ${connectorName}`);
    } catch (error) {
      console.error(`❌ Error pausing ${connectorName}:`, error);
      throw error;
    }
  }

  /**
   * Resume a connector
   */
  async resumeConnector(connectorName: string): Promise<void> {
    try {
      await this.client.put(`/connectors/${connectorName}/resume`);
      console.log(`✓ Resumed connector: ${connectorName}`);
    } catch (error) {
      console.error(`❌ Error resuming ${connectorName}:`, error);
      throw error;
    }
  }

  /**
   * Restart a connector
   */
  async restartConnector(connectorName: string): Promise<void> {
    try {
      await this.client.post(`/connectors/${connectorName}/restart`);
      console.log(`✓ Restarted connector: ${connectorName}`);
    } catch (error) {
      console.error(`❌ Error restarting ${connectorName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a connector
   */
  async deleteConnector(connectorName: string): Promise<void> {
    try {
      await this.client.delete(`/connectors/${connectorName}`);
      console.log(`✓ Deleted connector: ${connectorName}`);
    } catch (error) {
      console.error(`❌ Error deleting ${connectorName}:`, error);
      throw error;
    }
  }

  /**
   * Get connector configuration
   */
  async getConnectorConfig(connectorName: string): Promise<ConnectorConfig> {
    try {
      const response: AxiosResponse<ConnectorConfig> = await this.client.get(
        `/connectors/${connectorName}/config`
      );
      const config = response.data;

      console.log(`\n⚙️  Configuration for ${connectorName}:`);
      Object.entries(config).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      return config;
    } catch (error) {
      console.error(`❌ Error getting config for ${connectorName}:`, error);
      throw error;
    }
  }

  /**
   * Update connector configuration
   */
  async updateConnectorConfig(
    connectorName: string,
    newConfig: ConnectorConfig
  ): Promise<void> {
    try {
      await this.client.put(`/connectors/${connectorName}/config`, newConfig);
      console.log(`✓ Updated configuration for: ${connectorName}`);
    } catch (error) {
      console.error(`❌ Error updating config for ${connectorName}:`, error);
      throw error;
    }
  }

  /**
   * Deploy a new connector
   */
  async deployConnector(
    name: string,
    config: ConnectorConfig
  ): Promise<ConnectorInfo> {
    try {
      const response: AxiosResponse<ConnectorInfo> = await this.client.post(
        '/connectors',
        {
          name: name,
          config: config,
        }
      );

      console.log(`✓ Deployed connector: ${name}`);
      return response.data;
    } catch (error) {
      console.error(`✗ Failed to deploy ${name}:`, error);
      throw error;
    }
  }

  /**
   * Monitor connector metrics
   */
  async monitorConnectorMetrics(
    connectorName: string,
    interval: number = 5000,
    duration: number = 30000
  ): Promise<void> {
    console.log(`\n📈 Monitoring ${connectorName} (Ctrl+C to stop)...\n`);

    const startTime = Date.now();

    const monitorInterval = setInterval(async () => {
      try {
        await this.getConnectorStatus(connectorName);

        if (Date.now() - startTime >= duration) {
          clearInterval(monitorInterval);
          console.log('\n✓ Stopped monitoring');
        }
      } catch (error) {
        console.error('Error monitoring:', error);
        clearInterval(monitorInterval);
      }
    }, interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(monitorInterval);
      console.log('\n✓ Stopped monitoring');
      process.exit(0);
    });
  }

  /**
   * Get connector plugins
   */
  async listConnectorPlugins(): Promise<any[]> {
    try {
      const response = await this.client.get('/connector-plugins');
      const plugins = response.data;

      console.log(`\n🔌 Available Connector Plugins (${plugins.length}):`);
      plugins.forEach((plugin: any) => {
        console.log(`  - ${plugin.class}`);
        console.log(`    Version: ${plugin.version}`);
      });

      return plugins;
    } catch (error) {
      console.error('❌ Error listing plugins:', error);
      throw error;
    }
  }
}

/**
 * Main execution (demo usage)
 */
async function main(): Promise<void> {
  const manager = new KafkaConnectManager('http://localhost:8083');

  try {
    // Demo usage
    console.log('='.repeat(70));
    console.log('Kafka Connect Manager - TypeScript');
    console.log('='.repeat(70));

    // List connectors
    const connectors = await manager.listConnectors();

    // If connectors exist, get status of first one
    if (connectors.length > 0) {
      const connectorName = connectors[0];
      await manager.getConnectorStatus(connectorName);
      await manager.getConnectorConfig(connectorName);
    }

    // List available plugins
    await manager.listConnectorPlugins();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        console.error('\n❌ Cannot connect to Kafka Connect at http://localhost:8083');
        console.error('   Make sure Kafka Connect is running.');
      } else {
        console.error('\n❌ Error:', error.message);
      }
    } else {
      console.error('\n❌ Fatal error:', error);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { KafkaConnectManager, ConnectorConfig, ConnectorStatus, ConnectorInfo };
