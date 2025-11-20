import { connect, NatsConnection, StringCodec } from 'nats';

/**
 * Task message interface
 */
interface TaskMessage {
  task_id: string;
  timestamp: string;
}

/**
 * Load generator for testing queue groups
 * Generates many tasks to test scaling and load balancing
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  const taskCount = 50;
  console.log(`Generating ${taskCount} heavy tasks...\n`);

  const sc = StringCodec();
  const startTime = Date.now();

  try {
    for (let i = 1; i <= taskCount; i++) {
      const task: TaskMessage = {
        task_id: `HEAVY-${String(i).padStart(3, '0')}`,
        timestamp: new Date().toISOString()
      };

      nc.publish('tasks.heavy', sc.encode(JSON.stringify(task)));

      if (i % 10 === 0) {
        console.log(`Published ${i}/${taskCount} tasks...`);
      }
    }

    // Ensure all messages are sent
    await nc.flush();

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\nAll tasks published in ${totalTime.toFixed(2)}s`);
    console.log(`Rate: ${(taskCount / totalTime).toFixed(1)} tasks/sec`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the load generator
main().catch(console.error);
