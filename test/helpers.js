import expect from 'expect';
import proxyquire from 'proxyquire';
import { Map } from 'immutable';

// Custom assertions
expect.extend({
  toHaveActionOfType(expected) {
    expect.assert(
      this.actual.filter((action) => {
        return action.type === expected;
      }).length > 0,
      'Expected dispatched actions to have action %s',
      expected
    );

    return this;
  }
});

expect.extend({
  notToHaveActionOfType(expected) {
    expect.assert(
      this.actual.filter((action) => {
        return action.type === expected;
      }).length === 0,
      'Expected dispatched actions not to have action %s',
      expected
    );

    return this;
  }
});

export function requireWithMockConfigHelper(requirePath, modulePath, stub) {
  return proxyquire(requirePath, {
    [modulePath]: {
      conf: Map(stub),
      '@noCallThru': true
    }
  });
}

export function makeLocalForageStub() {
  const store = {};
  return {
    store,
    getItem: async (key) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (key in store) {
        const value = store[key];
        if (value instanceof Error) {
          throw value;
        } else {
          return value;
        }
      } else {
        return null;
      }
    },
    setItem: async (key, value) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      store[key] = value;
    },
    removeItem: async (key) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (key in store && store[key] instanceof Error) {
        throw store[key];
      } else {
        delete store[key];
      }
    },
    clear: () => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    }
  };
}
