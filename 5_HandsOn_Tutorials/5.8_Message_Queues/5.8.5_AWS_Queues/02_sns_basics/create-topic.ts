/**
 * SNS Topic Creation Examples
 *
 * Demonstrates creating Standard and FIFO SNS topics using AWS SDK v3
 */

import {
  SNSClient,
  CreateTopicCommand,
  CreateTopicCommandInput,
  SetTopicAttributesCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Create a standard SNS topic
 */
export async function createStandardTopic(topicName: string): Promise<string> {
  try {
    const params: CreateTopicCommandInput = {
      Name: topicName,
      Attributes: {
        DisplayName: 'My Standard Topic',
        FifoTopic: 'false',
      },
    };

    const command = new CreateTopicCommand(params);
    const response = await snsClient.send(command);

    if (!response.TopicArn) {
      throw new Error('TopicArn not returned from API');
    }

    console.log(`Standard topic created: ${response.TopicArn}`);
    return response.TopicArn;
  } catch (error) {
    console.error('Error creating standard topic:', error);
    throw error;
  }
}

/**
 * Create a FIFO SNS topic
 */
export async function createFifoTopic(topicName: string): Promise<string> {
  try {
    const fifoTopicName = topicName.endsWith('.fifo')
      ? topicName
      : `${topicName}.fifo`;

    const params: CreateTopicCommandInput = {
      Name: fifoTopicName,
      Attributes: {
        FifoTopic: 'true',
        ContentBasedDeduplication: 'true',
      },
    };

    const command = new CreateTopicCommand(params);
    const response = await snsClient.send(command);

    if (!response.TopicArn) {
      throw new Error('TopicArn not returned from API');
    }

    console.log(`FIFO topic created: ${response.TopicArn}`);
    return response.TopicArn;
  } catch (error) {
    console.error('Error creating FIFO topic:', error);
    throw error;
  }
}

/**
 * Set topic attributes
 */
export async function setTopicAttributes(
  topicArn: string,
  attributeName: string,
  attributeValue: string
): Promise<void> {
  try {
    const command = new SetTopicAttributesCommand({
      TopicArn: topicArn,
      AttributeName: attributeName,
      AttributeValue: attributeValue,
    });

    await snsClient.send(command);
    console.log(`Topic attribute set: ${attributeName} = ${attributeValue}`);
  } catch (error) {
    console.error('Error setting topic attributes:', error);
    throw error;
  }
}

/**
 * Get topic attributes
 */
export async function getTopicAttributes(
  topicArn: string
): Promise<Record<string, string>> {
  try {
    const command = new GetTopicAttributesCommand({
      TopicArn: topicArn,
    });

    const response = await snsClient.send(command);
    const attributes = response.Attributes || {};

    console.log('Topic Attributes:');
    Object.entries(attributes).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    return attributes;
  } catch (error) {
    console.error('Error getting topic attributes:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Create standard topic
      const standardTopicArn = await createStandardTopic('my-standard-topic');

      // Create FIFO topic
      const fifoTopicArn = await createFifoTopic('my-fifo-topic');

      // Set display name
      await setTopicAttributes(
        standardTopicArn,
        'DisplayName',
        'Production Alerts'
      );

      // Get attributes
      await getTopicAttributes(standardTopicArn);
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}
