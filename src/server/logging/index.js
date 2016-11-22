import winston from 'winston';

import { formatter, timestamp } from './lib/log-formatter.js';

// configure the 2 transports, share with all loggers, label from config ...
// add bug that label should be set in logger

const debug = process.env.DEBUGLOG;

// console transport for info level messages, sent to stderr
const transports = [
  new winston.transports.Console({
    colorize: true,
    formatter: formatter,
    level: 'info',
    stderrLevels: ['info'],
    timestamp: timestamp
  })
];

// default logger settings
const loggerDefaults = {
  exitOnError: false,
  levels: {
    info: 0,
    debug: 1
  },
  rewriters: [ idRewriter ],
  transports: transports,
};

winston.configure({
  ...loggerDefaults,
  id: 'root'
});

if (debug) {
  enableDebugLogger(debug, formatter, timestamp, winston);
}

export function enableDebugLogger(filename, formatter, timestamp, winston) {
  // TODO daily rotating log transport
  const transport = new winston.transports.File({
    filename: filename,
    formatter: formatter,
    json: false,
    level: 'debug',
    maxFiles: 1,
    maxsize: 1e+8, // 100MB
    tailable: true,
    timestamp: timestamp
  });
  winston.add(transport, null, true);
  // winston file transport will try and open file (maxRetries) and if it fails,
  // throw an error
  winston.info('enabling debug log', { path: debug }, (err) => {
    if (err) {
      winston.info('could not enable debug log', {
        path: debug,
        error: err
      });
    }
  });
  transports.push(transport);
}

export function idRewriter (level, msg, meta, logger) {
  if (logger.hasOwnProperty('id') && !meta.hasOwnProperty('__LOGGER_NAME__')) {
    meta.__LOGGER_NAME__ = logger.id;
  }
  return meta;
}

export function createLogger(name) {
  return new winston.Logger({
    ...loggerDefaults,
    id: name,
  });
}

const loggerContainer = () => {

  const loggers = {};

  return {

    getLogger(name) {
      if (!loggers[name]) {
        this.addLogger(name);
      }

      return loggers[name];
    },

    addLogger(name) {
      loggers[name] = createLogger(name);
      return loggers[name];
    },

    hasLogger(name) {
      return !!loggers[name];
    },

    closeLogger(name) {

      function _close(name) {
        if (!loggers[name]) {
          return;
        }

        loggers[name].close();
        delete loggers[name];
      }

      if (loggers[name]) {
        _close(name);
      } else {
        Object.keys(loggers).forEach((name) => {
          _close(name);
        });
      }
    }
  };
};

export default loggerContainer();
