// process-dead-letters.ts
import { PubSub, Message } from '@google-cloud/pubsub';

/**
 * Create a subscription to process dead letter messages
 */
async function createDeadLetterSubscription(
  projectId: string,
  deadLetterTopicId: string,
  dltSubscriptionId: string
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(deadLetterTopicId);

  try {
    const [subscription] = await topic.createSubscription(dltSubscriptionId, {
      ackDeadlineSeconds: 300,  // Longer deadline for investigation
    });
    console.log(`✓ Dead letter subscription created: ${subscription.name}`);
  } catch (error) {
    console.error('✗ Error:', error);
    throw error;
  }
}

/**
 * Process messages from dead letter topic
 */
async function processDeadLetterMessages(
  projectId: string,
  dltSubscriptionId: string
): Promise<void> {
  const pubsub = new PubSub({ projectId });
  const subscription = pubsub.subscription(dltSubscriptionId);

  subscription.on('message', (message: Message) => {
    console.log('\n' + '='.repeat(60));
    console.log('DEAD LETTER MESSAGE');
    console.log('='.repeat(60));
    console.log(`Message ID: ${message.id}`);
    console.log(`Publish time: ${message.publishTime.toDate()}`);
    console.log(`Data: ${message.data.toString('utf-8')}`);
    console.log(`Attributes: ${JSON.stringify(message.attributes)}`);

    // Check delivery attempt attribute
    if (message.attributes['googclient_deliveryattempt']) {
      const attempts = message.attributes['googclient_deliveryattempt'];
      console.log(`Delivery attempts: ${attempts}`);
    }

    // Analyze the failure
    analyzeFailure(message);

    // Log to monitoring system
    logDeadLetter(message);

    // Acknowledge to remove from DLT
    message.ack();
    console.log('✓ Dead letter message logged and acknowledged');
  });

  console.log(`Monitoring dead letter topic: ${dltSubscriptionId}`);
  console.log('Press Ctrl+C to stop\n');
}

function analyzeFailure(message: Message): void {
  const data = message.data.toString('utf-8');

  // Check for common failure patterns
  if (data.toLowerCase().includes('error')) {
    console.log("⚠ Failure pattern: Message contains 'error'");
  }
  if (message.data.length > 1000000) {
    console.log(`⚠ Failure pattern: Message too large (${message.data.length} bytes)`);
  }

  console.log('Analysis: Review message content and logs');
}

function logDeadLetter(message: Message): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message_id: message.id,
    publish_time: message.publishTime.toDate().toISOString(),
    data_length: message.data.length,
    attributes: message.attributes,
  };

  // In production: Send to Cloud Logging, BigQuery, or alerting system
  console.log(`Logged to monitoring: ${JSON.stringify(logEntry, null, 2)}`);
}

export { createDeadLetterSubscription, processDeadLetterMessages };
