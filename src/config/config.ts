import convict from 'convict';

// convict.addFormat(require('convict-format-with-validator').ipaddress);

// Define a schema
const config = convict({
  s3Bucket: {
    doc: 'The application environment.',
    default: 'development',
    env: 'S3_BUCKET'
  },
  queue: {
    doc: 'The IP address to bind.',
    default: '127.0.0.1',
    env: 'QUEUE',
  },
  topic: {
    doc: 'The port to bind.',
    default: 'DSFSFDSF',
    env: 'TOPIC',
  },
  eventBus: {
    doc: 'The port to bind.',
    default: 'FDSFSDFSFD',
    env: 'EVENT_BUS',
  },
  serviceName: {
    doc: 'The port to bind.',
    default: 'FDSFSDFSFD',
    env: 'SERVICE_NAME',
  }
});

// Perform validation
config.validate({allowed: 'strict'});

export default config;