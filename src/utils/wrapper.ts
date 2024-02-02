import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { logMetrics } from '@aws-lambda-powertools/metrics';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
import { Handler } from 'aws-lambda';
import { logger, metrics, tracer } from './utils';

interface WrapperOptions<T extends Handler> {
  handler: T;
  errorHandler?: middy.MiddlewareObj;
}

export const wrapper = <T extends Handler>(
  wrapperOptions: WrapperOptions<T>
): middy.MiddyfiedHandler => {
  const middyHandler = middy(wrapperOptions.handler)
    .use(injectLambdaContext(logger))
    .use(captureLambdaHandler(tracer))
    .use(logMetricsWithFunctionName());

  if (wrapperOptions.errorHandler) {
    middyHandler.use(wrapperOptions.errorHandler);
  }

  return middyHandler;
};

const logMetricsWithFunctionName = (): middy.MiddlewareObj<
  unknown,
  unknown
> => {
  const powertoolsMetrics = logMetrics(metrics, {
    captureColdStartMetric: true,
  });
  return {
    before: (request) => {
      metrics.setDefaultDimensions({
        function_name: request.context.functionName,
      });

      if (powertoolsMetrics.before) {
        powertoolsMetrics.before(request);
      }
    },
    after: powertoolsMetrics.after,
    onError: powertoolsMetrics.onError,
  };
};
