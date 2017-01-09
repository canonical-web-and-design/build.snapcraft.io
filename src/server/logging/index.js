import winston from 'winston';
import 'winston-daily-rotate-file';

import { conf } from '../helpers/config';
import { formatter, timestamp } from './lib/log-formatter.js';

// configure the transports, share with all loggers, label from config ...
// add bug that label should be set in logger

const LOGS_PATH = conf.get('LOGS_PATH');
const debug = process.env.DEBUGLOG;

// default logger settings
const loggerDefaults = {
  exitOnError: false,
  levels: {
    error: 0,
    info: 1,
    debug: 2
  },
  rewriters: [ idRewriter ]
};

winston.configure({
  ...loggerDefaults,
  id: 'root'
});

let debugTransport = null;
if (debug) {
  debugTransport = getDebugTransport(debug, formatter, timestamp, winston);
}

export function getDebugTransport(filename, formatter, timestamp, winston) {
  const transport = new winston.transports.DailyRotateFile({
    filename,
    formatter,
    json: false,
    level: 'debug',
    timestamp
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
  return transport;
}

export function idRewriter (level, msg, meta, logger) {
  if (logger.hasOwnProperty('id') && !meta.hasOwnProperty('__LOGGER_NAME__')) {
    meta.__LOGGER_NAME__ = logger.id;
  }
  return meta;
}

export function createLogger(name) {
  const transports = [];
  if (LOGS_PATH) {
    transports.push(new winston.transports.DailyRotateFile({
      filename: `${LOGS_PATH}/${name}.log`,
      formatter,
      json: false,
      level: 'info',
      timestamp
    }));
  } else {
    transports.push(new winston.transports.Console({
      colorize: true,
      formatter,
      level: 'info',
      stderrLevels: ['info'],
      timestamp
    }));
  }
  if (debugTransport !== null) {
    transports.push(debugTransport);
  }
  return new winston.Logger({
    ...loggerDefaults,
    id: name,
    transports
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
