import { Logger } from '@aws-lambda-powertools/logger';
import config from '../config/config';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
const serviceName = config.get('serviceName');
export const logger = new Logger({ serviceName });
export { Logger } from '@aws-lambda-powertools/logger';
export const tracer = new Tracer();
export const metrics = new Metrics();

export const stringIsGreaterThanBytes = (maxKB: number, value: string) => {
  const stringBytes = new Blob([value]).size;
  logger.debug(`String length is: ${stringBytes}`);
  const kb = stringBytes / 1000;
  logger.debug(`String KB is: ${kb}`);
  logger.debug(`String is greater than 200?: ${kb > maxKB}`);
  return kb > maxKB;
};

export const stringIsGreaterThan250KB = (value: string) => {
  const maxKB = 250;
  return stringIsGreaterThanBytes(maxKB, value);
};
