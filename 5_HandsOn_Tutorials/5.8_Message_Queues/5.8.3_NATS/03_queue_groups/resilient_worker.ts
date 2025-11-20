import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Task message interface
 */
interface TaskMessage {
  task_id: string;
}

/**
 * Worker statistics
 */
interface Stats {
  success: number;
  failed: number;
}

/**
 * Resilient worker with failure simulation
 * Demonstrates handling worker failures in queue groups
 */
async function main(): Promise<void> {
  const workerId: string = process.argv[2] || '1';
  const failureRate = 0.2; // 20% chance of simulated failure

  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  const sc = StringCodec();
  const stats: Stats = { success: 0, failed: 0 };

  console.log(`[Worker ${workerId}] Started (failure rate: ${failureRate * 100}%)\n`);

  try {
    // Subscribe to risky task queue
    const sub: Subscription = nc.subscribe('tasks.risky', { queue: 'risky-workers' });

    for await (const msg: Msg of sub) {
      const data: string = sc.decode(msg.data);
      const task: TaskMessage = JSON.parse(data);

      // Simulate random failures
      if (Math.random() < failureRate) {
        stats.failed++;
        console.log(
          `[Worker ${workerId}] ✗ Failed processing ${task.task_id} ` +
          `(failures: ${stats.failed})`
        );
        // In production, you'd publish to a dead letter queue
        continue;
      }

      // Successful processing
      await new Promise(resolve => setTimeout(resolve, 500));
      stats.success++;
      console.log(
        `[Worker ${workerId}] ✓ Completed ${task.task_id} ` +
        `(success: ${stats.success})`
      );
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error(`[Worker ${workerId}] Error:`, err);
    }
  } finally {
    console.log(`\n[Worker ${workerId}] Final Stats:`);
    console.log(`  Success: ${stats.success}`);
    console.log(`  Failed: ${stats.failed}`);
    const total = stats.success + stats.failed;
    if (total > 0) {
      const successRate = (stats.success / total) * 100;
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);
    }
    await nc.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

// Run the resilient worker
main().catch(console.error);
