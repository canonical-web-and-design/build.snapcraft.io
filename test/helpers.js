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

export function requireWithMockConfigHelper(requirePath, modulePath, stub) {
  return proxyquire(requirePath, {
    [modulePath]: {
      conf: Map(stub),
      '@noCallThru': true
    }
  });
}
