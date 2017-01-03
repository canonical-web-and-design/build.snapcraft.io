import Memcached from 'memcached';

import { conf } from '../helpers/config';

let memcached = null;

const getMemcachedStub = () => {
  return {
    get: (key, callback) => callback(),
    set: (key, value, lifetime, callback) => callback()
  };
};

const getInMemoryMemcachedStub = () => {
  const memcachedStub = { cache: {} };

  memcachedStub.get = (key, callback) => {
    if (callback) {
      callback(undefined, memcachedStub.cache[key]);
    }
  };
  memcachedStub.set = (key, value, lifetime, callback) => {
    memcachedStub.cache[key] = value;
    if (callback) {
      callback(undefined, true);
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
