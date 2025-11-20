import axios from 'axios';

/**
 * NATS server statistics
 */
interface ServerStats {
  server_id?: string;
  version?: string;
  uptime?: string;
  connections?: number;
  in_msgs?: number;
  out_msgs?: number;
  in_bytes?: number;
  out_bytes?: number;
  cluster?: {
    name?: string;
    routes?: any[];
  };
}

/**
 * Route information
 */
interface RouteInfo {
  rid?: string;
  remote_id?: string;
  ip?: string;
  port?: number;
  pending_size?: number;
}

/**
 * Routes response
 */
interface RoutesResponse {
  routes?: RouteInfo[];
}

/**
 * Cluster monitor
 * Monitors NATS cluster status via HTTP endpoints
 */
async function monitorCluster(): Promise<void> {
  const nodes = [
    { name: 'nats-1', port: 8222 },
    { name: 'nats-2', port: 8223 },
    { name: 'nats-3', port: 8224 }
  ];

  for (const node of nodes) {
    const url = `http://localhost:${node.port}/varz`;

    try {
      const response = await axios.get<ServerStats>(url);

      if (response.status === 200 && response.data) {
        const data = response.data;

        console.log('\n' + '='.repeat(50));
        console.log(`Node: ${node.name}`);
        console.log('='.repeat(50));
        console.log(`Server ID: ${data.server_id || 'N/A'}`);
        console.log(`Version: ${data.version || 'N/A'}`);
        console.log(`Uptime: ${data.uptime || 'N/A'}`);
        console.log(`Connections: ${data.connections || 0}`);
        console.log(`In Msgs: ${(data.in_msgs || 0).toLocaleString()}`);
        console.log(`Out Msgs: ${(data.out_msgs || 0).toLocaleString()}`);
        console.log(`In Bytes: ${(data.in_bytes || 0).toLocaleString()}`);
        console.log(`Out Bytes: ${(data.out_bytes || 0).toLocaleString()}`);

        // Cluster info
        if (data.cluster) {
          console.log(`\nCluster: ${data.cluster.name || 'N/A'}`);
          console.log(`Routes: ${data.cluster.routes?.length || 0}`);
        }
      }

    } catch (err) {
      console.log(`\n${node.name}: Error - ${err.message}`);
    }
  }

  // Check routes
  console.log('\n' + '='.repeat(50));
  console.log('Cluster Routes');
  console.log('='.repeat(50));

  const url = 'http://localhost:8222/routez';
  try {
    const response = await axios.get<RoutesResponse>(url);

    if (response.status === 200 && response.data.routes) {
      const routes = response.data.routes;

      console.log(`Total routes: ${routes.length}\n`);

      for (const route of routes) {
        console.log(`Route ID: ${route.rid}`);
        console.log(`  Remote ID: ${route.remote_id}`);
        console.log(`  IP: ${route.ip}`);
        console.log(`  Port: ${route.port}`);
        console.log(`  Pending: ${route.pending_size}`);
        console.log();
      }
    }

  } catch (err) {
    console.error(`Error getting routes: ${err.message}`);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    await monitorCluster();
  } catch (err) {
    console.error('Error:', err);
  }
}

// Run the cluster monitor
main().catch(console.error);
