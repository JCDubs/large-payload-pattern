import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { wrapper } from '../../utils/wrapper';
import { logger } from '../../utils/utils';
import { sendSNSMessage, sendSQSMessage, sendEvent } from '../../clients';
import { generatePayload } from '../../payload-generator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const payload = await generatePayload(event.body!);
    await sendSQSMessage(
      'ProducerLambda',
      'TestSQSCreateEvent',
      payload,
      'TestSQSCreateEvent',
      false
    );
    await sendSNSMessage(
      'ProducerLambda',
      'TestSNSCreateEvent',
      payload,
      'TestSNSCreateEvent',
      false
    );
    await sendEvent(
      'ProducerLambda',
      'TestEventBusCreateEvent',
      payload,
      false
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Message Sent',
      }),
    };
  } catch (error) {
    logger.error((error as Error).message, { error });
    return {
      statusCode: 500,
      body: (error as Error).message,
    };
  }
};

export const main = wrapper({
  handler,
});
