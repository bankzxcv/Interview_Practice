/**
 * EventBridge Rules and Event Routing
 *
 * Advanced event routing with pattern matching
 */

import {
  EventBridgeClient,
  CreateEventBusCommand,
  PutRuleCommand,
  PutTargetsCommand,
  PutEventsCommand,
  PutPermissionCommand,
} from '@aws-sdk/client-eventbridge';
import {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';

const eventbridge = new EventBridgeClient({ region: 'us-east-1' });
const sqs = new SQSClient({ region: 'us-east-1' });

interface EventPattern {
  source?: string[];
  'detail-type'?: string[];
  detail?: Record<string, any>;
}

/**
 * Setup EventBridge with SQS integration
 */
export class EventBridgeSetup {
  private eventBusName = 'order-events-bus';
  private eventBusArn?: string;

  async setup(): Promise<void> {
    console.log('Setting up EventBridge...\n');

    // Create event bus
    this.eventBusArn = await this.createEventBus();

    // Create SQS queue
    const queueUrl = await this.createQueue('order-processing-queue');
    const queueArn = await this.getQueueArn(queueUrl);

    // Allow EventBridge to send to SQS
    await this.allowEventBridgeToSqs(queueUrl, queueArn);

    // Create rules
    await this.createProcessingRule(queueArn);
    await this.createHighValueOrderRule(queueArn);

    console.log('\n✓ EventBridge setup complete');
  }

  private async createEventBus(): Promise<string> {
    const response = await eventbridge.send(
      new CreateEventBusCommand({ Name: this.eventBusName })
    );

    const arn = response.EventBusArn!;
    console.log('Event bus created:', arn);
    return arn;
  }

  private async createQueue(name: string): Promise<string> {
    const response = await sqs.send(
      new CreateQueueCommand({ QueueName: name })
    );
    console.log('Queue created:', response.QueueUrl);
    return response.QueueUrl!;
  }

  private async getQueueArn(queueUrl: string): Promise<string> {
    const response = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      })
    );
    return response.Attributes!.QueueArn!;
  }

  private async allowEventBridgeToSqs(
    queueUrl: string,
    queueArn: string
  ): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'events.amazonaws.com' },
          Action: 'sqs:SendMessage',
          Resource: queueArn,
        },
      ],
    };

    await sqs.send(
      new SetQueueAttributesCommand({
        QueueUrl: queueUrl,
        Attributes: { Policy: JSON.stringify(policy) },
      })
    );
  }

  private async createProcessingRule(queueArn: string): Promise<void> {
    const pattern: EventPattern = {
      source: ['order.service'],
      'detail-type': ['order.created', 'order.updated'],
    };

    await eventbridge.send(
      new PutRuleCommand({
        Name: 'order-processing-rule',
        EventBusName: this.eventBusName,
        EventPattern: JSON.stringify(pattern),
        State: 'ENABLED',
      })
    );

    await eventbridge.send(
      new PutTargetsCommand({
        Rule: 'order-processing-rule',
        EventBusName: this.eventBusName,
        Targets: [
          {
            Id: '1',
            Arn: queueArn,
          },
        ],
      })
    );

    console.log('Created rule: order-processing-rule');
  }

  private async createHighValueOrderRule(queueArn: string): Promise<void> {
    const pattern: EventPattern = {
      source: ['order.service'],
      'detail-type': ['order.created'],
      detail: {
        total: [{ numeric: ['>', 1000] }],
      },
    };

    await eventbridge.send(
      new PutRuleCommand({
        Name: 'high-value-order-rule',
        EventBusName: this.eventBusName,
        EventPattern: JSON.stringify(pattern),
        State: 'ENABLED',
      })
    );

    await eventbridge.send(
      new PutTargetsCommand({
        Rule: 'high-value-order-rule',
        EventBusName: this.eventBusName,
        Targets: [{ Id: '1', Arn: queueArn }],
      })
    );

    console.log('Created rule: high-value-order-rule');
  }

  /**
   * Publish event to EventBridge
   */
  async publishEvent(
    detailType: string,
    detail: Record<string, any>
  ): Promise<string> {
    const response = await eventbridge.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'order.service',
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            EventBusName: this.eventBusName,
          },
        ],
      })
    );

    const eventId = response.Entries?.[0].EventId!;
    console.log('Published event:', eventId);
    return eventId;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      const eb = new EventBridgeSetup();
      await eb.setup();

      // Publish test events
      await eb.publishEvent('order.created', {
        order_id: 'ORD-001',
        customer: 'john@example.com',
        total: 1500,
      });

      console.log('\n✓ Demo complete');
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}
