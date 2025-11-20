/**
 * SQS + SNS Fanout Integration
 *
 * Complete implementation of fanout pattern with order processing example
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
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

const snsClient = new SNSClient({ region: 'us-east-1' });
const sqsClient = new SQSClient({ region: 'us-east-1' });

interface OrderEvent {
  event_type: string;
  order_id: string;
  customer: string;
  total: number;
  timestamp: string;
}

interface QueueInfo {
  name: string;
  url: string;
  arn: string;
  subscriptionArn: string;
  purpose: string;
}

/**
 * Setup complete fanout architecture
 */
export class FanoutArchitecture {
  private topicArn?: string;
  private queues: QueueInfo[] = [];

  async setup(): Promise<void> {
    console.log('Setting up SNS + SQS Fanout Pattern...\n');

    // Create SNS topic
    this.topicArn = await this.createTopic();

    // Create and subscribe queues
    await this.createQueues();

    // Apply message filtering
    await this.applyFilters();

    console.log('\n✓ Fanout architecture ready!');
  }

  private async createTopic(): Promise<string> {
    const response = await snsClient.send(
      new CreateTopicCommand({ Name: 'order-events' })
    );

    if (!response.TopicArn) throw new Error('TopicArn not returned');

    console.log(`Created topic: ${response.TopicArn}`);
    return response.TopicArn;
  }

  private async createQueues(): Promise<void> {
    const queueConfigs = [
      { name: 'order-payment-queue', purpose: 'Process payments' },
      { name: 'order-inventory-queue', purpose: 'Update inventory' },
      { name: 'order-notification-queue', purpose: 'Send notifications' },
      { name: 'order-analytics-queue', purpose: 'Track analytics' },
    ];

    for (const config of queueConfigs) {
      const queueUrl = await this.createQueue(config.name);
      const queueArn = await this.getQueueArn(queueUrl);
      await this.allowSNSToWriteToQueue(queueUrl, queueArn);
      const subscriptionArn = await this.subscribeQueueToTopic(queueArn);

      this.queues.push({
        name: config.name,
        url: queueUrl,
        arn: queueArn,
        subscriptionArn,
        purpose: config.purpose,
      });

      console.log(`Created: ${config.name} - ${config.purpose}`);
    }
  }

  private async createQueue(name: string): Promise<string> {
    const response = await sqsClient.send(
      new CreateQueueCommand({
        QueueName: name,
        Attributes: {
          VisibilityTimeout: '30',
          MessageRetentionPeriod: '345600',
          ReceiveMessageWaitTimeSeconds: '20',
        },
      })
    );

    if (!response.QueueUrl) throw new Error('QueueUrl not returned');
    return response.QueueUrl;
  }

  private async getQueueArn(queueUrl: string): Promise<string> {
    const response = await sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      })
    );

    const arn = response.Attributes?.QueueArn;
    if (!arn) throw new Error('QueueArn not found');
    return arn;
  }

  private async allowSNSToWriteToQueue(
    queueUrl: string,
    queueArn: string
  ): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'sns.amazonaws.com' },
          Action: 'sqs:SendMessage',
          Resource: queueArn,
          Condition: {
            ArnEquals: { 'aws:SourceArn': this.topicArn },
          },
        },
      ],
    };

    await sqsClient.send(
      new SetQueueAttributesCommand({
        QueueUrl: queueUrl,
        Attributes: { Policy: JSON.stringify(policy) },
      })
    );
  }

  private async subscribeQueueToTopic(queueArn: string): Promise<string> {
    const response = await snsClient.send(
      new SubscribeCommand({
        TopicArn: this.topicArn!,
        Protocol: 'sqs',
        Endpoint: queueArn,
      })
    );

    if (!response.SubscriptionArn) throw new Error('SubscriptionArn not returned');
    return response.SubscriptionArn;
  }

  private async applyFilters(): Promise<void> {
    // Payment queue: created and cancelled events
    await snsClient.send(
      new SetSubscriptionAttributesCommand({
        SubscriptionArn: this.queues[0].subscriptionArn,
        AttributeName: 'FilterPolicy',
        AttributeValue: JSON.stringify({
          event_type: ['order.created', 'order.cancelled'],
        }),
      })
    );

    // Inventory queue: created, updated, cancelled
    await snsClient.send(
      new SetSubscriptionAttributesCommand({
        SubscriptionArn: this.queues[1].subscriptionArn,
        AttributeName: 'FilterPolicy',
        AttributeValue: JSON.stringify({
          event_type: ['order.created', 'order.updated', 'order.cancelled'],
        }),
      })
    );

    // Notification queue: all events (no filter)
    // Analytics queue: all events (no filter)

    console.log('\nFilter policies applied');
  }

  async publishEvent(event: OrderEvent): Promise<string> {
    if (!this.topicArn) throw new Error('Topic not created');

    const response = await snsClient.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(event),
        Subject: `Order Event: ${event.event_type}`,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: event.event_type,
          },
          order_value: {
            DataType: 'Number',
            StringValue: event.total.toString(),
          },
        },
      })
    );

    if (!response.MessageId) throw new Error('MessageId not returned');

    console.log(`Published ${event.event_type}: ${response.MessageId}`);
    return response.MessageId;
  }

  getQueues(): QueueInfo[] {
    return this.queues;
  }
}

/**
 * Payment Service Consumer
 */
export class PaymentService {
  constructor(private queueUrl: string) {}

  async processOrders(): Promise<void> {
    console.log('Payment Service listening...');

    while (true) {
      const response = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
        })
      );

      const messages = response.Messages || [];

      for (const message of messages) {
        try {
          if (!message.Body || !message.ReceiptHandle) continue;

          const snsMessage = JSON.parse(message.Body);
          const orderEvent: OrderEvent = JSON.parse(snsMessage.Message);

          console.log(`Processing payment for order: ${orderEvent.order_id}`);
          console.log(`Amount: $${orderEvent.total}`);

          // Simulate payment processing
          await new Promise((r) => setTimeout(r, 500));

          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: this.queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            })
          );

          console.log(`Payment processed: ${orderEvent.order_id}\n`);
        } catch (error) {
          console.error('Error processing payment:', error);
        }
      }
    }
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      const fanout = new FanoutArchitecture();
      await fanout.setup();

      // Publish test events
      const events: OrderEvent[] = [
        {
          event_type: 'order.created',
          order_id: 'ORD-001',
          customer: 'john@example.com',
          total: 150.0,
          timestamp: new Date().toISOString(),
        },
        {
          event_type: 'order.updated',
          order_id: 'ORD-001',
          customer: 'john@example.com',
          total: 175.0,
          timestamp: new Date().toISOString(),
        },
      ];

      console.log('\nPublishing events...\n');
      for (const event of events) {
        await fanout.publishEvent(event);
      }

      console.log('\n✓ Demo completed');
      console.log('\nQueues created:');
      fanout.getQueues().forEach((q) => console.log(`  ${q.name}: ${q.url}`));
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}
