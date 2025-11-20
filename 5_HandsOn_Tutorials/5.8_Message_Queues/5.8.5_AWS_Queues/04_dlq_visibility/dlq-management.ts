/**
 * Dead Letter Queue Management
 *
 * Comprehensive DLQ setup, monitoring, and recovery
 */

import {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
  Message,
} from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  PutMetricAlarmCommand,
} from '@aws-sdk/client-cloudwatch';

const sqsClient = new SQSClient({ region: 'us-east-1' });
const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

/**
 * Setup queue with DLQ
 */
export async function setupQueueWithDLQ(
  queueName: string,
  maxReceiveCount: number = 3
): Promise<{ queueUrl: string; dlqUrl: string }> {
  try {
    // Create DLQ
    const dlqResponse = await sqsClient.send(
      new CreateQueueCommand({
        QueueName: `${queueName}-dlq`,
        Attributes: {
          MessageRetentionPeriod: '1209600', // 14 days
        },
      })
    );

    const dlqUrl = dlqResponse.QueueUrl!;

    // Get DLQ ARN
    const dlqAttrs = await sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['QueueArn'],
      })
    );

    const dlqArn = dlqAttrs.Attributes!.QueueArn!;

    // Create source queue with redrive policy
    const queueResponse = await sqsClient.send(
      new CreateQueueCommand({
        QueueName: queueName,
        Attributes: {
          VisibilityTimeout: '30',
          MessageRetentionPeriod: '345600',
          RedrivePolicy: JSON.stringify({
            deadLetterTargetArn: dlqArn,
            maxReceiveCount: maxReceiveCount.toString(),
          }),
        },
      })
    );

    const queueUrl = queueResponse.QueueUrl!;

    console.log(`Queue created: ${queueUrl}`);
    console.log(`DLQ created: ${dlqUrl}`);
    console.log(`Max receive count: ${maxReceiveCount}`);

    return { queueUrl, dlqUrl };
  } catch (error) {
    console.error('Error setting up queue with DLQ:', error);
    throw error;
  }
}

/**
 * Process message with visibility timeout extension
 */
export async function processWithVisibilityExtension(
  queueUrl: string,
  processFunc: (body: string) => Promise<void>
): Promise<void> {
  try {
    const response = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      })
    );

    const message = response.Messages?.[0];
    if (!message || !message.ReceiptHandle) {
      console.log('No messages');
      return;
    }

    try {
      // Extend visibility for long-running operation
      await sqsClient.send(
        new ChangeMessageVisibilityCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
          VisibilityTimeout: 300, // 5 minutes
        })
      );

      console.log('Visibility timeout extended to 5 minutes');

      // Process message
      await processFunc(message.Body!);

      // Delete on success
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );

      console.log('Message processed and deleted');
    } catch (error) {
      // Make immediately visible for retry
      await sqsClient.send(
        new ChangeMessageVisibilityCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
          VisibilityTimeout: 0,
        })
      );

      console.error('Processing failed, message made visible for retry:', error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Redrive messages from DLQ back to source queue
 */
export async function redriveMessagesFromDLQ(
  dlqUrl: string,
  targetQueueUrl: string,
  maxMessages: number = 10
): Promise<number> {
  let movedCount = 0;

  try {
    while (true) {
      const response = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: dlqUrl,
          MaxNumberOfMessages: maxMessages,
          WaitTimeSeconds: 5,
          AttributeNames: ['All'],
          MessageAttributeNames: ['All'],
        })
      );

      const messages = response.Messages || [];
      if (messages.length === 0) break;

      for (const message of messages) {
        try {
          if (!message.Body || !message.ReceiptHandle) continue;

          // Send to target queue
          await sqsClient.send(
            new SendMessageCommand({
              QueueUrl: targetQueueUrl,
              MessageBody: message.Body,
              MessageAttributes: message.MessageAttributes,
            })
          );

          // Delete from DLQ
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: dlqUrl,
              ReceiptHandle: message.ReceiptHandle,
            })
          );

          movedCount++;
          console.log(`Moved message: ${message.MessageId}`);
        } catch (error) {
          console.error('Error moving message:', error);
        }
      }
    }

    console.log(`Total messages moved: ${movedCount}`);
    return movedCount;
  } catch (error) {
    console.error('Error redriving messages:', error);
    throw error;
  }
}

/**
 * Create CloudWatch alarm for DLQ
 */
export async function createDLQAlarm(
  queueName: string,
  snsTopicArn: string
): Promise<void> {
  try {
    await cloudwatch.send(
      new PutMetricAlarmCommand({
        AlarmName: `${queueName}-dlq-messages`,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
        Period: 60,
        Statistic: 'Average',
        Threshold: 0,
        ActionsEnabled: true,
        AlarmDescription: 'Alert when messages appear in DLQ',
        AlarmActions: [snsTopicArn],
        Dimensions: [
          {
            Name: 'QueueName',
            Value: `${queueName}-dlq`,
          },
        ],
      })
    );

    console.log('DLQ alarm created');
  } catch (error) {
    console.error('Error creating alarm:', error);
    throw error;
  }
}

/**
 * Message processor with retry logic
 */
export class MessageProcessor {
  constructor(private queueUrl: string) {}

  async processMessages(): Promise<void> {
    console.log('Processing messages with DLQ support...');

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
        await this.processMessage(message);
      }
    }
  }

  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) return;

    try {
      const data = JSON.parse(message.Body);
      console.log(`Processing: ${data.order_id}`);

      // Simulate processing
      if (Math.random() > 0.8) {
        throw new Error('Simulated processing error');
      }

      // Success - delete message
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );

      console.log(`Success: ${message.MessageId}`);
    } catch (error) {
      console.error(`Failed: ${message.MessageId}`, error);
      // Message will retry until maxReceiveCount, then move to DLQ
    }
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Setup queue with DLQ
      const { queueUrl, dlqUrl } = await setupQueueWithDLQ(
        'order-processing-queue',
        3
      );

      // Send test message
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({ order_id: 'TEST-001', total: 100 }),
        })
      );

      console.log('\n✓ DLQ setup complete');
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}
