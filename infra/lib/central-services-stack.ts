import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Topic } from 'aws-cdk-lib/aws-sns';

export class CentralServicesStack extends cdk.Stack {
  centralEventBus: EventBus;
  centralSNSTopic: Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.centralEventBus = new EventBus(this, 'CentralEventBus'); 
    this.centralSNSTopic = new Topic(this, 'CentralSNSTopic', {
      displayName: 'Central SNS Topic',
      fifo: true,
      contentBasedDeduplication: true,
    });
  }
}
