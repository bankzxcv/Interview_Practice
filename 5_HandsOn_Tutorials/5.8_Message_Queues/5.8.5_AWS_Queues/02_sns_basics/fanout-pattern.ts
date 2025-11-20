/**
 * SNS Fanout Pattern Example
 *
 * Demonstrates the fanout pattern: one message published to SNS
 * is delivered to multiple SQS queues for parallel processing
 */

import {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
  PublishCommand,
  SetSubscriptionAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface QueueConfig {
  name: string;
  url: string;
  arn: string;
  subscriptionArn: string;
}

/**
 * Setup complete fanout pattern infrastructure
 */
export async function setupFanoutPattern(): Promise<{
  topicArn: string;
  queues: QueueConfig[];
}> {
  try {
    // Create SNS topic
    const topicResponse = await snsClient.send(
      new CreateTopicCommand({
        Name: 'order-events',
      })
    );

    const topicArn = topicResponse.TopicArn;
    if (!topicArn) {
      throw new Error('TopicArn not returned');
    }

    console.log(`Created SNS topic: ${topicArn}\n`);

    // Create multiple SQS queues for different purposes
    const queueNames = [
      'order-processing',
      'order-analytics',
      'order-notifications',
    ];

    const queues: QueueConfig[] = [];

    for (const queueName of queueNames) {
      // Create queue
      const queueResponse = await sqsClient.send(
        new CreateQueueCommand({
          QueueName: queueName,
          Attributes: {
            VisibilityTimeout: '30',
            MessageRetentionPeriod: '345600',
            ReceiveMessageWaitTimeSeconds: '20',
          },
        })
      );

      const queueUrl = queueResponse.QueueUrl;
      if (!queueUrl) {
        throw new Error('QueueUrl not returned');
      }

      // Get queue ARN
      const attrsResponse = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['QueueArn'],
        })
      );

      const queueArn = attrsResponse.Attributes?.QueueArn;
      if (!queueArn) {
        throw new Error('QueueArn not found');
      }

      // Update queue policy to allow SNS
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'sns.amazonaws.com',
            },
            Action: 'sqs:SendMessage',
            Resource: queueArn,
            Condition: {
              ArnEquals: {
                'aws:SourceArn': topicArn,
              },
            },
          },
        ],
      };

      await sqsClient.send(
        new SetQueueAttributesCommand({
          QueueUrl: queueUrl,
          Attributes: {
            Policy: JSON.stringify(policy),
          },
        })
      );

      // Subscribe queue to topic
      const subscriptionResponse = await snsClient.send(
        new SubscribeCommand({
          TopicArn: topicArn,
          Protocol: 'sqs',
          Endpoint: queueArn,
        })
      );

      const subscriptionArn = subscriptionResponse.SubscriptionArn;
      if (!subscriptionArn) {
        throw new Error('SubscriptionArn not returned');
      }

      queues.push({
        name: queueName,
        url: queueUrl,
        arn: queueArn,
        subscriptionArn,
      });

      console.log(`Created and subscribed: ${queueName}`);
    }

    console.log('\nFanout pattern setup complete!');
    return { topicArn, queues };
  } catch (error) {
    console.error('Error setting up fanout pattern:', error);
    throw error;
  }
}

/**
 * Setup fanout with message filtering
 */
export async function setupFanoutWithFiltering(
  topicArn: string,
  queues: QueueConfig[]
): Promise<void> {
  try {
    // Set filter policies for each queue

    // Payment queue: only order.created and order.cancelled
    await snsClient.send(
      new SetSubscriptionAttributesCommand({
        SubscriptionArn: queues[0].subscriptionArn,
        AttributeName: 'FilterPolicy',
        AttributeValue: JSON.stringify({
          event_type: ['order.created', 'order.cancelled'],
        }),
      })
    );
    console.log('Payment queue filter: order.created, order.cancelled');

    // Analytics queue: order.created and order.completed
    await snsClient.send(
      new SetSubscriptionAttributesCommand({
        SubscriptionArn: queues[1].subscriptionArn,
        AttributeName: 'FilterPolicy',
        AttributeValue: JSON.stringify({
          event_type: ['order.created', 'order.completed'],
        }),
      })
    );
    console.log('Analytics queue filter: order.created, order.completed');

    // Notification queue: all order events (no filter)
    console.log('Notification queue: receives all messages (no filter)');

    console.log('\nFilter policies applied successfully');
  } catch (error) {
    console.error('Error setting up filtering:', error);
    throw error;
  }
}

/**
 * Publish message to fanout topic
 */
export async function publishToFanout(
  topicArn: string,
  eventType: string,
  orderData: Record<string, any>
): Promise<string> {
  try {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(orderData),
      Subject: `Order Event: ${eventType}`,
      MessageAttributes: {
        event_type: {
          DataType: 'String',
          StringValue: eventType,
        },
        order_value: {
          DataType: 'Number',
          StringValue: orderData.total?.toString() || '0',
        },
      },
    });

    const response = await snsClient.send(command);

    if (!response.MessageId) {
      throw new Error('MessageId not returned');
    }

    console.log(`Published ${eventType}: ${response.MessageId}`);
    console.log('Message will be delivered to all matching subscribers');

    return response.MessageId;
  } catch (error) {
    console.error('Error publishing to fanout:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      console.log('=== SNS Fanout Pattern Demo ===\n');

      // Setup fanout infrastructure
      const { topicArn, queues } = await setupFanoutPattern();

      // Apply message filtering
      await setupFanoutWithFiltering(topicArn, queues);

      console.log('\n=== Publishing Test Messages ===\n');

      // Publish different event types
      const orderData = {
        order_id: '12345',
        customer: 'john@example.com',
        total: 99.99,
        items: [{ product: 'Widget', quantity: 2 }],
      };

      // This goes to payment and notification queues
      await publishToFanout(topicArn, 'order.created', orderData);

      // This goes to analytics and notification queues
      await publishToFanout(topicArn, 'order.completed', {
        ...orderData,
        status: 'completed',
      });

      // This goes to payment and notification queues
      await publishToFanout(topicArn, 'order.cancelled', {
        ...orderData,
        reason: 'customer_request',
      });

      console.log('\n✓ Fanout demo completed successfully');
      console.log('\nCheck your SQS queues to see filtered message delivery:');
      queues.forEach((q) => console.log(`  - ${q.name}: ${q.url}`));
    } catch (error) {
      console.error('Fanout demo failed:', error);
      process.exit(1);
    }
  })();
}
