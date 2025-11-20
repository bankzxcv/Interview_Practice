/**
 * Production Patterns: Batch Operations and Cost Optimization
 *
 * Best practices for production messaging systems
 */

import {
  SQSClient,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  DeleteMessageBatchCommand,
  Message,
} from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';

const sqs = new SQSClient({ region: 'us-east-1' });
const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

/**
 * Efficient batch processor
 */
export class BatchProcessor {
  constructor(private queueUrl: string, private batchSize: number = 10) {}

  /**
   * Send messages in batches
   */
  async sendBatch(messages: Array<Record<string, any>>): Promise<{
    successful: number;
    failed: number;
  }> {
    const results = { successful: 0, failed: 0 };

    for (let i = 0; i < messages.length; i += this.batchSize) {
      const batch = messages.slice(i, i + this.batchSize);

      const response = await sqs.send(
        new SendMessageBatchCommand({
          QueueUrl: this.queueUrl,
          Entries: batch.map((msg, idx) => ({
            Id: `${i + idx}`,
            MessageBody: JSON.stringify(msg),
          })),
        })
      );

      results.successful += response.Successful?.length || 0;
      results.failed += response.Failed?.length || 0;

      // Log failures
      response.Failed?.forEach((f) =>
        console.error(`Failed ${f.Id}: ${f.Message}`)
      );
    }

    console.log(`Batch send: ${results.successful} success, ${results.failed} failed`);
    return results;
  }

  /**
   * Process messages with long polling
   */
  async processBatch(): Promise<number> {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: this.batchSize,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
      })
    );

    const messages = response.Messages || [];
    if (messages.length === 0) return 0;

    console.log(`Received ${messages.length} messages`);

    // Process messages in parallel
    await Promise.all(messages.map((m) => this.processMessage(m)));

    // Delete in batch
    await this.deleteBatch(messages);

    return messages.length;
  }

  private async processMessage(message: Message): Promise<void> {
    const data = JSON.parse(message.Body!);
    console.log('Processing:', data.order_id);
    // Process logic here
  }

  private async deleteBatch(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;

    await sqs.send(
      new DeleteMessageBatchCommand({
        QueueUrl: this.queueUrl,
        Entries: messages.map((m, idx) => ({
          Id: `${idx}`,
          ReceiptHandle: m.ReceiptHandle!,
        })),
      })
    );

    console.log(`Deleted ${messages.length} messages`);
  }
}

/**
 * Cost monitoring
 */
export class CostMonitor {
  async getUsageMetrics(
    queueName: string,
    days: number = 7
  ): Promise<{ sent: number; received: number; estimatedCost: number }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

    // Get messages sent
    const sentResponse = await cloudwatch.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/SQS',
        MetricName: 'NumberOfMessagesSent',
        Dimensions: [{ Name: 'QueueName', Value: queueName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 86400,
        Statistics: ['Sum'],
      })
    );

    // Get messages received
    const receivedResponse = await cloudwatch.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/SQS',
        MetricName: 'NumberOfMessagesReceived',
        Dimensions: [{ Name: 'QueueName', Value: queueName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 86400,
        Statistics: ['Sum'],
      })
    );

    const totalSent = sentResponse.Datapoints?.reduce(
      (sum, dp) => sum + (dp.Sum || 0),
      0
    ) || 0;

    const totalReceived = receivedResponse.Datapoints?.reduce(
      (sum, dp) => sum + (dp.Sum || 0),
      0
    ) || 0;

    // SQS pricing: $0.40 per million requests
    const totalRequests = totalSent + totalReceived;
    const estimatedCost = (totalRequests / 1_000_000) * 0.4;

    console.log('Queue:', queueName);
    console.log('Messages sent:', totalSent.toLocaleString());
    console.log('Messages received:', totalReceived.toLocaleString());
    console.log('Estimated cost: $' + estimatedCost.toFixed(2));

    return { sent: totalSent, received: totalReceived, estimatedCost };
  }
}

/**
 * Auto-scaling configuration
 */
export interface AutoScalingConfig {
  minCapacity: number;
  maxCapacity: number;
  targetQueueDepth: number;
  scaleInCooldown: number;
  scaleOutCooldown: number;
}

export function getRecommendedAutoScaling(
  avgProcessingTime: number,
  targetLatency: number
): AutoScalingConfig {
  // Calculate optimal target queue depth
  const targetQueueDepth = Math.ceil(targetLatency / avgProcessingTime);

  return {
    minCapacity: 1,
    maxCapacity: 10,
    targetQueueDepth,
    scaleInCooldown: 300, // 5 minutes
    scaleOutCooldown: 60, // 1 minute
  };
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      const queueUrl =
        'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';

      // Batch send example
      const processor = new BatchProcessor(queueUrl);
      const testMessages = Array.from({ length: 25 }, (_, i) => ({
        order_id: `ORD-${i}`,
        total: 100 + i * 10,
      }));

      await processor.sendBatch(testMessages);

      // Cost monitoring
      const monitor = new CostMonitor();
      await monitor.getUsageMetrics('my-queue', 7);

      console.log('\n✓ Production patterns demo complete');
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}
