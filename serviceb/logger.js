const { createLogger, format, transports } = require('winston');
const { json } = format;
const LokiTransport = require("winston-loki");
const lokiHost = process.env.LOKI_HOST || 'localhost';
const lokiPort = process.env.LOKI_PORT || '3100';

const logger = createLogger({
  level: 'info',
  format: json(),
  defaultMeta: { job: 'service-b' },
  transports: [
    new transports.Console(),
    new LokiTransport({ host: `http://${lokiHost}:${lokiPort}`, format: json()}),
  ]
});

module.exports = logger;