// monitoring.ts
import { v2 as monitoring } from '@google-cloud/monitoring';

interface MetricValue {
  timestamp: Date;
  value: number;
}

/**
 * Monitor Pub/Sub metrics
 */
class PubSubMonitor {
  private projectId: string;
  private client: monitoring.MetricServiceClient;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.client = new monitoring.MetricServiceClient();
  }

  /**
   * Get comprehensive metrics for a subscription
   */
  async getSubscriptionMetrics(subscriptionId: string): Promise<{
    numUndeliveredMessages: MetricValue[];
    oldestUnackedMessageAge: MetricValue[];
  }> {
    const metrics = {
      numUndeliveredMessages: await this.getMetric(
        'pubsub.googleapis.com/subscription/num_undelivered_messages',
        subscriptionId,
        'pubsub_subscription'
      ),
      oldestUnackedMessageAge: await this.getMetric(
        'pubsub.googleapis.com/subscription/oldest_unacked_message_age',
        subscriptionId,
        'pubsub_subscription'
      ),
    };

    return metrics;
  }

  /**
   * Get metrics for a topic
   */
  async getTopicMetrics(topicId: string): Promise<{
    sendRequestCount: MetricValue[];
  }> {
    const metrics = {
      sendRequestCount: await this.getMetric(
        'pubsub.googleapis.com/topic/send_request_count',
        topicId,
        'pubsub_topic'
      ),
    };

    return metrics;
  }

  /**
   * Fetch metric from Cloud Monitoring
   */
  private async getMetric(
    metricType: string,
    resourceId: string,
    resourceType: string = 'pubsub_subscription'
  ): Promise<MetricValue[]> {
    const projectPath = this.client.projectPath(this.projectId);

    const now = Date.now();
    const oneHourAgo = now - 3600 * 1000;

    const request = {
      name: projectPath,
      filter: `metric.type="${metricType}" ` +
             `AND resource.type="${resourceType}" ` +
             `AND resource.labels.${resourceType === 'pubsub_subscription' ? 'subscription_id' : 'topic_id'}="${resourceId}"`,
      interval: {
        endTime: {
          seconds: Math.floor(now / 1000),
        },
        startTime: {
          seconds: Math.floor(oneHourAgo / 1000),
        },
      },
      view: 'FULL' as const,
    };

    const [timeSeries] = await this.client.listTimeSeries(request);

    const values: MetricValue[] = [];
    for (const series of timeSeries) {
      if (series.points) {
        for (const point of series.points) {
          if (point.interval?.endTime && point.value) {
            values.push({
              timestamp: new Date(
                (point.interval.endTime.seconds as number) * 1000
              ),
              value: (point.value.int64Value as number) ||
                     (point.value.doubleValue as number) ||
                     0,
            });
          }
        }
      }
    }

    return values;
  }

  /**
   * Print health summary for subscription
   */
  async printSubscriptionHealth(subscriptionId: string): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log(`Subscription Health: ${subscriptionId}`);
    console.log('='.repeat(60));

    const metrics = await this.getSubscriptionMetrics(subscriptionId);

    // Undelivered messages
    if (metrics.numUndeliveredMessages.length > 0) {
      const latest = metrics.numUndeliveredMessages[
        metrics.numUndeliveredMessages.length - 1
      ].value;
      console.log(`Undelivered messages: ${latest}`);

      if (latest > 10000) {
        console.log('  ⚠️ WARNING: High backlog!');
      } else if (latest > 1000) {
        console.log('  ⚠️ CAUTION: Increasing backlog');
      } else {
        console.log('  ✓ Healthy backlog');
      }
    }

    // Oldest unacked message
    if (metrics.oldestUnackedMessageAge.length > 0) {
      const ageSeconds = metrics.oldestUnackedMessageAge[
        metrics.oldestUnackedMessageAge.length - 1
      ].value;
      const ageMinutes = ageSeconds / 60;

      console.log(`Oldest unacked message: ${ageMinutes.toFixed(1)} minutes`);

      if (ageMinutes > 60) {
        console.log('  ⚠️ WARNING: Messages stuck!');
      } else if (ageMinutes > 30) {
        console.log('  ⚠️ CAUTION: Slow processing');
      } else {
        console.log('  ✓ Processing is current');
      }
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
  const SUBSCRIPTION_ID = 'orders-processor';

  const monitor = new PubSubMonitor(PROJECT_ID);
  monitor.printSubscriptionHealth(SUBSCRIPTION_ID).catch(console.error);
}

export { PubSubMonitor };
