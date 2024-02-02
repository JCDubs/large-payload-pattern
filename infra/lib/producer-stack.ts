import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Topic } from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'path';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';

export interface ProducerStackProps extends cdk.StackProps {
  centralEventBus: EventBus;
  centralSNSTopic: Topic;
  consumerSQS: Queue;
}

export class ProducerStack extends cdk.Stack {
  bucket: s3.Bucket;
  producerLambda: nodeLambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: ProducerStackProps) {
    super(scope, id, props);

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '0.5',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
    };
    
    this.bucket = new s3.Bucket(this, 'ProducerEventsBucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    this.producerLambda = new nodeLambda.NodejsFunction(this, 'ProducerLambda', {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(
          __dirname,
          '../../src/handler/producer/producer.ts'
        ),
        memorySize: 1024,
        handler: 'main',
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(20),
        bundling: {
          minify: true,
        },
        environment: {
          S3_BUCKET: this.bucket.bucketName,
          QUEUE: props.consumerSQS.queueUrl,
          TOPIC: props.centralSNSTopic.topicArn,
          EVENT_BUS: props.centralEventBus.eventBusName,
          SERVICE_NAME: 'ProducerLambda',
          POWERTOOLS_SERVICE_NAME: 'ProducerLambda',
          POWERTOOLS_METRICS_NAMESPACE: 'PRODUCER_LAMBDA',
          ...lambdaPowerToolsConfig,
        },
      });

      props.centralEventBus.grantPutEventsTo(this.producerLambda);
      props.centralSNSTopic.grantPublish(this.producerLambda);
      props.consumerSQS.grantSendMessages(this.producerLambda);
      this.bucket.grantReadWrite(this.producerLambda);

      const api = new RestApi(this, 'Endpoint');
      api.root.addMethod('POST', new LambdaIntegration(this.producerLambda));
  }
}
