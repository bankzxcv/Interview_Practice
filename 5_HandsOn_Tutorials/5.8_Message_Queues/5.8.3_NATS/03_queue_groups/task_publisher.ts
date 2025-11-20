import { connect, NatsConnection, StringCodec } from 'nats';

/**
 * Task message interface
 */
interface TaskMessage {
  task_id: string;
  timestamp: string;
  data: string;
}

/**
 * Task publisher for queue group
 * Publishes tasks that will be distributed across workers
 */
async function main(): Promise<void> {
  const nc: NatsConnection = await connect({ servers: 'nats://localhost:4222' });

  console.log('Publishing 20 tasks to queue group...\n');

  const sc = StringCodec();

  try {
    for (let i = 1; i <= 20; i++) {
      const task: TaskMessage = {
        task_id: `TASK-${String(i).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        data: 'Process this task'
      };

      nc.publish('tasks.process', sc.encode(JSON.stringify(task)));
      console.log(`Published: ${task.task_id}`);

      // Wait 200ms between tasks
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Ensure all messages are sent
    await nc.flush();

    console.log('\nAll tasks published!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await nc.close();
  }
}

// Run the publisher
main().catch(console.error);
