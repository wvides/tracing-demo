const opentracing = require('opentracing');
const connect = require('./db');
const tracer = require('./jaeger');
const express = require('express');
const logger = require('./logger');
const app = express();
const util = require('util');

app.get('/', (req, res, err) => {
  const parentSpan = tracer.extract(opentracing.FORMAT_TEXT_MAP, req.headers);
  const span = tracer.startSpan(req.path, { childOf: parentSpan});
  logger.info(`${req.method}, ${req.path}`, {span_id: parentSpan._spanIdStr});
  addTagsToSpan(span, res.statusCode, req.method, req.path);
  databaseConnect(span, () => {
    res.statusCode = 200;
    span.finish();
    return res.json({status: "success from service b", object: {}});
  });
});

function databaseConnect(parent, callback) {
  const span = tracer.startSpan('database-connect', { childOf: parent });
  connect((err) => {
    span.finish();
    return callback();
  });
}

function addTagsToSpan(span, statusCode, method, path) {
  span.addTags({
    [opentracing.Tags.HTTP_STATUS_CODE]: statusCode,
    [opentracing.Tags.SPAN_KIND]: opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER,
    [opentracing.Tags.HTTP_METHOD]: method,
    [opentracing.Tags.HTTP_URL]: path
  });
}

app.listen(3002, () => {
  logger.info(`listening on port 3002`)
});
