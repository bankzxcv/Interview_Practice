import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Task message interface
 */
interface TaskMessage {
  task_id: string;
  timestamp: string;
}

/**
 * Processing statistics
 */
interface Stats {
  processed: number;
  totalTime: number;
}

/**
 * Scalable processor with performance tracking
 * Demonstrates horizontal scaling with queue groups
 */
async function main(): Promise<void> {
  // Get worker ID and processing time from command line
  const workerId: string = process.argv[2] || '1';
  const processingTime: number = parseFloat(process.argv[3]) || 2.0;

  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log(`[Worker ${workerId}] Started`);
  console.log(`[Worker ${workerId}] Processing time: ${processingTime}s per task\n`);

  const sc = StringCodec();
  const stats: Stats = { processed: 0, totalTime: 0 };

  try {
    // Subscribe to heavy task queue
    const sub: Subscription = nc.subscribe('tasks.heavy', { queue: 'heavy-workers' });

    console.log(`[Worker ${workerId}] Ready for tasks\n`);

    for await (const msg: Msg of sub) {
      const startTime = Date.now();
      const data: string = sc.decode(msg.data);
      const task: TaskMessage = JSON.parse(data);

      console.log(`[Worker ${workerId}] Processing ${task.task_id}...`);

      // Simulate CPU-intensive work
      await new Promise(resolve => setTimeout(resolve, processingTime * 1000));

      const elapsed = (Date.now() - startTime) / 1000;
      stats.processed++;
      stats.totalTime += elapsed;

      const avgTime = stats.totalTime / stats.processed;
      console.log(
        `[Worker ${workerId}] ✓ ${task.task_id} done in ${elapsed.toFixed(2)}s ` +
        `(avg: ${avgTime.toFixed(2)}s, total: ${stats.processed})`
      );
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error(`[Worker ${workerId}] Error:`, err);
    }
  } finally {
    console.log(`\n[Worker ${workerId}] Stats:`);
    console.log(`  Processed: ${stats.processed}`);
    const avgTime = stats.processed > 0 ? stats.totalTime / stats.processed : 0;
    console.log(`  Avg time: ${avgTime.toFixed(2)}s`);
    await nc.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

// Run the scalable processor
main().catch(console.error);
