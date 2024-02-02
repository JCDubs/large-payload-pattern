import config from '../../config/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { logger } from '../../utils/utils';
import { generatePayload } from '../../payload-generator';
const sqs = new SQSClient({});
const queue = config.get('queue');

export const sendSQSMessage = async (
  source: string,
  detailType: string,
  message: string,
  messageGroupId: string,
  formatPayload = true
) => {
  try {
    let sqsMessage = message;
    if (formatPayload) {
      sqsMessage = await generatePayload(message);
    }
    const command = new SendMessageCommand({
      QueueUrl: queue,
      MessageGroupId: messageGroupId,
      MessageBody: JSON.stringify({
        metaData: {
          source,
          detailType,
        },
        data: sqsMessage,
      }),
    });

    const response = await sqs.send(command);

    if (response.$metadata.httpStatusCode !== 200) {
      const errorMessage = 'Error sending message to SQS';
      logger.error(errorMessage, { response });
      throw new Error(errorMessage);
    }
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
};
