import chalk from 'chalk';

export const timestamp = () => {
  return new Date().toISOString()
    .replace(/T/, ' ');
};

// slightly modified version of winston serializer to match talisker style
// http://talisker.readthedocs.io/en/latest/logging.html#log-format
export const serialize = (obj, key) => {
  // symbols cannot be directly casted to strings
  if (typeof key === 'symbol') {
    key = key.toString();
  }
  if (typeof obj === 'symbol') {
    obj = obj.toString();
  }

  if (obj === null) {
    obj = 'null';
  }
  else if (obj === undefined) {
    obj = 'undefined';
  }
  else if (obj === false) {
    obj = 'false';
  }

  // talisker specific substitutions: spaces, equals, doublequote
  if (key) {
    key = key
      .replace(/[ =,]/g, '_')
      .replace(/"/g, '');
  }

  if (typeof obj !== 'object') {
    // talisker specific
    if (obj.split && obj.split(' ').length > 1) {
      obj = `"${obj}"`;
    }
    return key ? key + '=' + obj : obj;
  }

  if (obj instanceof Buffer) {
    return key ? key + '=' + obj.toString('base64') : obj.toString('base64');
  }

  let msg = '';
  const keys = Object.keys(obj);
  const length = keys.length;

  for (let i = 0; i < length; i++) {
    if (Array.isArray(obj[keys[i]])) {
      msg += keys[i] + '=[';

      for (let j = 0, l = obj[keys[i]].length; j < l; j++) {
        msg += serialize(obj[keys[i]][j]);
        if (j < l - 1) {
          msg += ', ';
        }
      }

      msg += ']';
    }
    else if (obj[keys[i]] instanceof Date) {
      msg += keys[i] + '="' + obj[keys[i]];
    }
    else {
      msg += serialize(obj[keys[i]], keys[i]);
    }

    if (i < length - 1) {
      msg += ', ';
    }
  }

  return msg;
};

const _formatter = (options) => {
  const name = options.meta.__LOGGER_NAME__ || '';
  delete options.meta.__LOGGER_NAME__;
  const meta = options.meta && Object.keys(options.meta).length ? serialize(options.meta) : '';
  const message = options.message ? JSON.stringify(options.message) : '';
  const level = options.level.toUpperCase();
  const ts = options.timestamp();


  return { ts, level, name, meta, message };
};

export const formatter = (options) => {
  const { ts, level, name , meta, message } = _formatter(options);

  if (!options.colorize) {
    return `${ts} ${level} ${name} ${message} ${meta}`;
  } else {
    return `${chalk.magenta(ts)} ${level}`
      + ` ${chalk.blue(name)}`
      + ` ${chalk.yellow(message)}`
      + ` ${chalk.cyan(meta)}`;
  }

};
