import axios from 'axios';

/**
 * Subscription information from NATS monitoring endpoint
 */
interface Subscription {
  subject: string;
  queue?: string;
}

/**
 * Subscriptions response from NATS
 */
interface SubscriptionsResponse {
  subscriptions?: Subscription[];
}

/**
 * Queue group monitor
 * Monitors NATS queue groups via HTTP monitoring endpoint
 */
async function monitorQueueGroups(): Promise<void> {
  while (true) {
    try {
      // Get subscription details from NATS monitoring endpoint
      const response = await axios.get<SubscriptionsResponse>('http://localhost:8222/subsz');

      if (response.status === 200 && response.data.subscriptions) {
        console.log('\n' + '='.repeat(60));
        console.log('NATS Queue Groups Status');
        console.log('='.repeat(60));

        // Group subscriptions by queue name
        const queueGroups: Record<string, string[]> = {};

        for (const sub of response.data.subscriptions) {
          if (sub.queue) {
            if (!queueGroups[sub.queue]) {
              queueGroups[sub.queue] = [];
            }
            queueGroups[sub.queue].push(sub.subject);
          }
        }

        if (Object.keys(queueGroups).length > 0) {
          for (const [queueName, subjects] of Object.entries(queueGroups)) {
            console.log(`\nQueue Group: ${queueName}`);
            console.log(`  Subjects: ${[...new Set(subjects)].join(', ')}`);
            console.log(`  Workers: ${subjects.length}`);
          }
        } else {
          console.log('\nNo active queue groups');
        }

        console.log('\n' + '='.repeat(60));
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('Error:', error);
      }
    }

    // Update every 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('Starting NATS Queue Group Monitor...');
  console.log('(Make sure NATS server is running on localhost:8222)\n');

  try {
    await monitorQueueGroups();
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nMonitor stopped');
  process.exit(0);
});

// Run the monitor
main().catch(console.error);
