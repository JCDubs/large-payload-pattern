import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import config from '../config/config';
import { logger } from './utils';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

const s3 = new S3Client({});
const bucketName = config.get('s3Bucket');

export type S3Payload = {
  s3Url: string;
};

export const saveToS3 = async (
  objectName: string,
  body: string
): Promise<void> => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      Body: body,
    });
    await s3.send(command);
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
};

export const generateUrl = async (objectName: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    });

    const url = getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    return url;
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
};

export const createS3Payload = async (body: string): Promise<S3Payload> => {
  try {
    const objectName = uuid();
    await saveToS3(objectName, body);
    const s3Url = await generateUrl(objectName);
    return { s3Url };
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
};
