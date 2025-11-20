/**
 * SNS Subscription Examples
 *
 * Demonstrates subscribing various endpoints to SNS topics
 */

import {
  SNSClient,
  SubscribeCommand,
  SubscribeCommandInput,
  SetSubscriptionAttributesCommand,
  SQSClient,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
} from '@aws-sdk/client-sns';
import { SQSClient as SQS } from '@aws-sdk/client-sqs';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const sqsClient = new SQS({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Subscribe SQS queue to SNS topic
 */
export async function subscribeSqsToTopic(
  topicArn: string,
  queueUrl: string
): Promise<string> {
  try {
    // Get queue ARN
    const queueAttrsResponse = await sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      })
    );

    const queueArn = queueAttrsResponse.Attributes?.QueueArn;
    if (!queueArn) {
      throw new Error('Queue ARN not found');
    }

    // Subscribe queue to topic
    const subscribeCommand = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'sqs',
      Endpoint: queueArn,
    });

    const subscribeResponse = await snsClient.send(subscribeCommand);
    const subscriptionArn = subscribeResponse.SubscriptionArn;

    if (!subscriptionArn) {
      throw new Error('SubscriptionArn not returned');
    }

    // Update queue policy to allow SNS
    const queuePolicy = {
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
          Policy: JSON.stringify(queuePolicy),
        },
      })
    );

    console.log(`SQS subscribed: ${subscriptionArn}`);
    return subscriptionArn;
  } catch (error) {
    console.error('Error subscribing SQS to topic:', error);
    throw error;
  }
}

/**
 * Subscribe Lambda function to SNS topic
 */
export async function subscribeLambdaToTopic(
  topicArn: string,
  lambdaArn: string
): Promise<string> {
  try {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'lambda',
      Endpoint: lambdaArn,
    });

    const response = await snsClient.send(command);

    if (!response.SubscriptionArn) {
      throw new Error('SubscriptionArn not returned');
    }

    console.log(`Lambda subscribed: ${response.SubscriptionArn}`);
    console.log('Note: Lambda must have permission for SNS to invoke it');
    return response.SubscriptionArn;
  } catch (error) {
    console.error('Error subscribing Lambda to topic:', error);
    throw error;
  }
}

/**
 * Subscribe HTTPS endpoint to SNS topic
 */
export async function subscribeHttpsEndpoint(
  topicArn: string,
  httpsUrl: string
): Promise<string> {
  try {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'https',
      Endpoint: httpsUrl,
    });

    const response = await snsClient.send(command);

    if (!response.SubscriptionArn) {
      throw new Error('SubscriptionArn not returned');
    }

    console.log(`HTTPS endpoint subscribed: ${response.SubscriptionArn}`);
    console.log('Note: Endpoint must confirm subscription via SubscribeURL');
    return response.SubscriptionArn;
  } catch (error) {
    console.error('Error subscribing HTTPS endpoint:', error);
    throw error;
  }
}

/**
 * Subscribe email address to SNS topic
 */
export async function subscribeEmail(
  topicArn: string,
  emailAddress: string
): Promise<string> {
  try {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'email',
      Endpoint: emailAddress,
    });

    const response = await snsClient.send(command);

    if (!response.SubscriptionArn) {
      throw new Error('SubscriptionArn not returned');
    }

    console.log('Email subscription created (pending confirmation)');
    console.log('User must confirm subscription via email');
    return response.SubscriptionArn;
  } catch (error) {
    console.error('Error subscribing email:', error);
    throw error;
  }
}

/**
 * Subscribe SMS to SNS topic
 */
export async function subscribeSms(
  topicArn: string,
  phoneNumber: string
): Promise<string> {
  try {
    // Phone number must be in E.164 format (e.g., +1234567890)
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'sms',
      Endpoint: phoneNumber,
    });

    const response = await snsClient.send(command);

    if (!response.SubscriptionArn) {
      throw new Error('SubscriptionArn not returned');
    }

    console.log(`SMS subscribed: ${response.SubscriptionArn}`);
    return response.SubscriptionArn;
  } catch (error) {
    console.error('Error subscribing SMS:', error);
    throw error;
  }
}

/**
 * Set subscription filter policy
 */
export async function setSubscriptionFilterPolicy(
  subscriptionArn: string,
  filterPolicy: Record<string, any>
): Promise<void> {
  try {
    const command = new SetSubscriptionAttributesCommand({
      SubscriptionArn: subscriptionArn,
      AttributeName: 'FilterPolicy',
      AttributeValue: JSON.stringify(filterPolicy),
    });

    await snsClient.send(command);
    console.log('Filter policy set successfully');
  } catch (error) {
    console.error('Error setting filter policy:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      const topicArn =
        process.env.TOPIC_ARN ||
        'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Subscribe SQS queue
      const queueUrl =
        'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
      const sqsSubscriptionArn = await subscribeSqsToTopic(topicArn, queueUrl);

      // Set filter policy for SQS subscription
      const filterPolicy = {
        event_type: ['order.created', 'order.updated'],
        order_value: [{ numeric: ['>', 100] }],
      };
      await setSubscriptionFilterPolicy(sqsSubscriptionArn, filterPolicy);

      // Subscribe email (requires confirmation)
      await subscribeEmail(topicArn, 'user@example.com');

      // Subscribe Lambda
      const lambdaArn =
        'arn:aws:lambda:us-east-1:123456789012:function:my-function';
      await subscribeLambdaToTopic(topicArn, lambdaArn);

      console.log('\nAll subscriptions created successfully');
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}
