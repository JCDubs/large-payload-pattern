import config from '../../config/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { logger } from '../../utils/utils';
import { generatePayload } from '../../payload-generator';
const snsClient = new SNSClient({});
const topic = config.get('topic');

export const sendSNSMessage = async (
  source: string,
  detailType: string,
  message: string,
  messageGroupId: string,
  formatPayload = true
) => {
  try {
    let snsMessage = message;
    if (formatPayload) {
      snsMessage = await generatePayload(message);
    }
    const command = new PublishCommand({
      TopicArn: topic,
      MessageGroupId: messageGroupId,
      Message: JSON.stringify({
        metaData: {
          source,
          detailType,
        },
        data: snsMessage,
      }),
    });

    const response = await snsClient.send(command);

    if (response.$metadata.httpStatusCode !== 200) {
      const errorMessage = 'Error sending message to SNS';
      logger.error(errorMessage, { response });
      throw new Error(errorMessage);
    }
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
};
