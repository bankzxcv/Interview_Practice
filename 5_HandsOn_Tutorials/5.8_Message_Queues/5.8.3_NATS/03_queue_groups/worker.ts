import { connect, NatsConnection, Msg, StringCodec, Subscription } from 'nats';

/**
 * Task message interface
 */
interface TaskMessage {
  task_id: string;
  timestamp: string;
  data: string;
}

/**
 * Queue group worker example
 * Multiple workers share the load from the same queue group
 */
async function main(): Promise<void> {
  // Get worker ID from command line argument or default to '1'
  const workerId: string = process.argv[2] || '1';

  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log(`[Worker ${workerId}] Started`);
  console.log(`[Worker ${workerId}] Joined queue group: 'processors'\n`);

  const sc = StringCodec();
  let messageCount = 0;

  try {
    // Subscribe with queue group name 'processors'
    const sub: Subscription = nc.subscribe('tasks.process', { queue: 'processors' });

    console.log(`[Worker ${workerId}] Waiting for tasks...\n`);

    for await (const msg: Msg of sub) {
      messageCount++;

      const data: string = sc.decode(msg.data);
      const task: TaskMessage = JSON.parse(data);

      console.log(`[Worker ${workerId}] Processing message #${messageCount}`);
      console.log(`  Task ID: ${task.task_id}`);
      console.log(`  Timestamp: ${task.timestamp}`);

      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`[Worker ${workerId}] Completed task ${task.task_id}\n`);
    }

  } catch (err) {
    if (err.code !== 'CANCELLED') {
      console.error(`[Worker ${workerId}] Error:`, err);
    }
  } finally {
    console.log(`\n[Worker ${workerId}] Shutting down...`);
    console.log(`[Worker ${workerId}] Processed ${messageCount} messages`);
    await nc.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

// Run the worker
main().catch(console.error);
