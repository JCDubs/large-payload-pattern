import { createS3Payload, stringIsGreaterThan250KB } from '../utils';

export const generatePayload = async (payload: string): Promise<string> => {
  let generatedPayload = payload;
  if (stringIsGreaterThan250KB(payload)) {
    generatedPayload = JSON.stringify(await createS3Payload(payload));
  }
  return generatedPayload;
};
