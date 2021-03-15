const jaegerHost = process.env.JAEGER_HOST || 'localhost';
const jaegerPort = process.env.JAEGER_PORT || '14268';
const { initTracer } = require('jaeger-client');
const config = {
  serviceName: 'service-a',
  reporter: {
    collectorEndpoint: `http://${jaegerHost}:${jaegerPort}/api/traces`,
    logSpans: false,
  },
  sampler: {
    type: 'const',
    param: 1
  }
};
const options = {
  tags: {
    'service-a.version': '1.0.0',
  },
  logger: console,
};
const tracer = initTracer(config, options);

module.exports = tracer