#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CentralServicesStack } from '../lib/central-services-stack';
import { ConsumerStack } from '../lib/consumer-stack';
import { ProducerStack } from '../lib/producer-stack';

const app = new cdk.App();
const centralServicesStack = new CentralServicesStack(app, 'CentralServiceStack', {});
const consumerStack = new ConsumerStack(app, 'ConsumerStack', {
    centralEventBus: centralServicesStack.centralEventBus,
    centralSNSTopic: centralServicesStack.centralSNSTopic,
});
const producerStack = new ProducerStack(app, 'ProducerStack', {
    centralEventBus: centralServicesStack.centralEventBus,
    centralSNSTopic: centralServicesStack.centralSNSTopic,
    consumerSQS: consumerStack.consumerSQS,
});
