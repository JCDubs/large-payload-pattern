import { SQSEvent, SQSHandler } from 'aws-lambda';
import { wrapper } from '../../utils/wrapper';
import { logger } from '../../utils/utils';
import { payloadProcessorMiddleware } from '../../middleware/index';

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const { body } = record;
    logger.debug('Received SQS message:', {body});
  }
};

export const main = wrapper({
    handler,
  }).use(payloadProcessorMiddleware());
