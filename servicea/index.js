const tracer = require('./jaeger');
const connect = require('./db');
const logger = require('./logger');
const express = require('express');
const opentracing = require('opentracing');
const app = express();
const util = require('util');
const bent = require('bent');

const serviceB = process.env.SERVICE_B || 'localhost';
const serviceBPort = process.env.SERVICE_B_PORT || 3002;
const serviceAPort = process.env.SERVICE_A_PORT || 3001;

app.get('/downstream', async (req, res, err) => {
  const span = tracer.startSpan(req.path);
  logger.info(`${req.method}, ${req.path}`, {span_id: span.context().toSpanId()});
  let hd = {};
  const url = `http://${serviceB}:${serviceBPort}`;
  tracer.inject(span, opentracing.FORMAT_TEXT_MAP, hd);
  const request = bent('string', hd)
  try {
    const response = await request(url) 
    addTagsToSpan(span, res.statusCode, req.method, req.path);
    span.finish();
    return res.send(response);
  } catch (e) {
    res.statusCode = 500;
    span.addTags({ [opentracing.Tags.ERROR]: e });
    addTagsToSpan(span, res.statusCode, req.method, req.path);
    span.finish();
    return res.send(e);  
  }
  
});

app.get('/', (req, res, err) => {
  const span = tracer.startSpan(req.path);
  logger.info(`${req.method}, ${req.path}`, {span_id: span.context().toSpanId()});
  db(span, (objects, err) => {
    if (err) {
      res.statusCode = 500;
      addTagsToSpan(span, res.statusCode, req.method, req.path);
      span.finish();
      return res.json({ success: false });
    }
    res.statusCode = 200
    addTagsToSpan(span, res.statusCode, req.method, req.path);
    span.finish();
    return res.json({ success: true, objects });
  });
});


function addTagsToSpan(span, statusCode, method, path) {
  span.addTags({
    [opentracing.Tags.HTTP_STATUS_CODE]: statusCode,
    [opentracing.Tags.SPAN_KIND]: opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER,
    [opentracing.Tags.HTTP_METHOD]: method,
    [opentracing.Tags.HTTP_URL]: path
  });
}

function db(span, callback) {
  const childSpan = tracer.startSpan("db-function", {
    childOf: span
  });
  childSpan.addTags({
    [opentracing.Tags.DB_INSTANCE]: "local-mongo"
  })
  connect((err) => {
    childSpan.finish();
    return callback({}, false);
  })
}

app.listen(serviceAPort, () => {
  logger.info(`listening on port ${serviceAPort}`)
})