import config from '../../config/config';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { logger } from '../../utils/utils';
import { generatePayload } from '../../payload-generator';
const eventbridge = new EventBridgeClient({});
const eventBus = config.get('eventBus');

export const sendEvent = async (
  source: string,
  detailType: string,
  eventData: string,
  formatPayload = true
) => {
  try {
    let formattedEvent = eventData;
    if (formatPayload) {
      formattedEvent = await generatePayload(eventData);
    }
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: source,
          EventBusName: eventBus,
          DetailType: detailType,
          Detail: formattedEvent,
        },
      ],
    });

    const response = await eventbridge.send(command);

    if (response.$metadata.httpStatusCode !== 200) {
      const errorMessage = 'Error sending event to the Event Bus';
      logger.error(errorMessage, { response });
      throw new Error(errorMessage);
    }
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
};
