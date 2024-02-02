import middy from '@middy/core';
import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda'

type ProcessRecordResult = {
    successful: boolean;
    messageId: string;
}

const processRequest = async (record: SQSRecord): Promise<ProcessRecordResult> => {
    try {
        const { body } = record;
        const parsedBody = JSON.parse(body);
        let data;
    
        if (parsedBody.data) { // SQS
            data = JSON.parse(parsedBody.data);
        } else if ( parsedBody.detail) {// EventBridge
            data = parsedBody.detail;
        } else if (parsedBody.Message) { // SNS
            const message = JSON.parse(parsedBody.Message);
            data = JSON.parse(message.data);
        } else {
            throw Error('Could not identify message type.');
        }
    
        if ( !data.s3Url ) {
          record.body = data;
          return {
            successful: true,
            messageId: record.messageId
          };
        }
    
        const response = await fetch(data.s3Url);
        
        if ( response.status !== 200) {
            const errorMessage = 'Unable to retrieve request data from S3.';
            throw Error(errorMessage);
        } 

        record.body = await response.text();
        return {
            successful: true,
            messageId: record.messageId
        };
    } catch (error) {
        return {
            successful: false,
            messageId: record.messageId
        };
    }
}

export const payloadProcessorMiddleware = (): middy.MiddlewareObj<SQSEvent, SQSBatchResponse> => {
    const before: middy.MiddlewareFn<SQSEvent, SQSBatchResponse> = async (request): Promise<void> => {
        const failedItems = [];
        for (const record of request.event.Records) {
            try {
                const processResult = await processRequest(record);
                if (!processResult.successful) {
                    failedItems.push({ itemIdentifier: record.messageId });
                    continue;
                }
            } catch (error) {
                failedItems.push({ itemIdentifier: record.messageId });
            }
        }
        if (failedItems.length > 0) {
            request.response = {
                batchItemFailures: failedItems,
            }  
        }
    }

    return {
        before,
    }
}
