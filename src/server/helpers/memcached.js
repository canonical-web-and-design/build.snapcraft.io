import Memcached from 'memcached';

import { conf } from '../helpers/config';

let memcached = null;

// Return a Promise that calls the given callback soon, but not immediately.
// This helps to exercise asynchronicity bugs in memcached client code.
const runSoon = (callback) => {
  return new Promise((resolve) => setTimeout(resolve, 1)).then(callback);
};

const getMemcachedStub = () => {
  return {
    get: (key, callback) => runSoon(callback),
    set: (key, value, lifetime, callback) => runSoon(callback),
    del: (key, callback) => runSoon(callback)
  };
};

const getInMemoryMemcachedStub = () => {
  const memcachedStub = { cache: {} };

  memcachedStub.get = (key, callback) => {
    return runSoon(() => callback(undefined, memcachedStub.cache[key]));
  };
  memcachedStub.set = (key, value, lifetime, callback) => {
    memcachedStub.cache[key] = value;
    return runSoon(() => callback(undefined, true));
  };
  memcachedStub.del = (key, callback) => {
    delete memcachedStub.cache[key];
    return runSoon(() => callback(undefined));
  };

  return memcachedStub;
};

const promisifyMethod = (rawMemcached, name) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      rawMemcached[name](...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
};

const promisifyMemcached = (rawMemcached) => {
  const wrapper = { cache: rawMemcached.cache };

  wrapper.get = promisifyMethod(rawMemcached, 'get');
  wrapper.set = promisifyMethod(rawMemcached, 'set');
  wrapper.del = promisifyMethod(rawMemcached, 'del');

  return wrapper;
};

export const getMemcached = () => {
  const host = conf.get('MEMCACHED_HOST') ? conf.get('MEMCACHED_HOST').split(',') : null;

  if (memcached === null) {
    let rawMemcached;
    if (host) {
      rawMemcached = new Memcached(host, { namespace: 'lp:' });
    } else {
      rawMemcached = getMemcachedStub();
    }
    memcached = promisifyMemcached(rawMemcached);
  }
  return memcached;
};

// Test affordance
export const setupInMemoryMemcached = (cache) => {
  memcached = promisifyMemcached(getInMemoryMemcachedStub());

  // copy initial cache values
  for (const key in cache) {
    memcached.cache[key] = cache[key];
  }
};

export const resetMemcached = () => {
  memcached = null;
};
