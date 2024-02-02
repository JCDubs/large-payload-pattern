import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'path';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import * as rule from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

interface ConsumerStackProps extends cdk.StackProps {
  centralEventBus: EventBus;
  centralSNSTopic: Topic;
}

export class ConsumerStack extends cdk.Stack {
  consumerSQS: Queue;
  consumerLambda: nodeLambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: ConsumerStackProps) {
    super(scope, id, props);

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '0.5',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
    };
    
    this.consumerSQS = new Queue(this, 'ConsumerSQS', {
      fifo: true,
      contentBasedDeduplication: true,
    }); 
    props.centralSNSTopic.addSubscription(new SqsSubscription(this.consumerSQS));
    
    new rule.Rule(this, 'ConsumerRule', {
      eventBus: props.centralEventBus,
      eventPattern: {
        source: ['ProducerLambda'],
      },
      targets: [
        new targets.SqsQueue(this.consumerSQS, { messageGroupId : 'ProducerService'}) 
      ]
    });

    this.consumerLambda = new nodeLambda.NodejsFunction(this, 'ConsumerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        '../../src/handler/consumer/consumer.ts'
      ),
      memorySize: 1024,
      handler: 'main',
      tracing: lambda.Tracing.ACTIVE,
      bundling: {
        minify: true,
      },
      environment: {
        SERVICE_NAME: 'ConsumerLambda',
        POWERTOOLS_SERVICE_NAME: 'ConsumerLambda',
        POWERTOOLS_METRICS_NAMESPACE: 'CONSUMER_LAMBDA',
        ...lambdaPowerToolsConfig,
      },
    });

    this.consumerLambda.addEventSource(new SqsEventSource(this.consumerSQS));
  }
}
