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
    if (callback) {
      return runSoon(() => callback(undefined, memcachedStub.cache[key]));
    } else {
      return Promise.resolve();
    }
  };
  memcachedStub.set = (key, value, lifetime, callback) => {
    memcachedStub.cache[key] = value;
    if (callback) {
      return runSoon(() => callback(undefined, true));
    } else {
      return Promise.resolve();
    }
  };
  memcachedStub.del = (key, callback) => {
    delete memcachedStub.cache[key];

    if (callback) {
      return runSoon(() => callback(undefined));
    } else {
      return Promise.resolve();
    }
  };

  return memcachedStub;
};

export const getMemcached = () => {
  const host = conf.get('MEMCACHED_HOST') ? conf.get('MEMCACHED_HOST').split(',') : null;

  if (memcached === null) {
    if (host) {
      memcached = new Memcached(host, { namespace: 'lp:' });
    } else {
      memcached = getMemcachedStub();
    }
  }
  return memcached;
};

// Test affordance
export const setupInMemoryMemcached = () => {
  memcached = getInMemoryMemcachedStub();
};

export const resetMemcached = () => {
  memcached = null;
};
