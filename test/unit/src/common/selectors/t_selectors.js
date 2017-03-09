import expect from 'expect';

import { hasNoRegisteredNames } from '../../../../../src/common/selectors';

describe('hasNoRegisteredNames', function() {

  const stateWithNoName = {
    snaps: {
      snaps: [{}, {}]
    }
  };

  const stateWithName = {
    snaps: {
      snaps: [{
        store_name: 'bsi-test-ii'
      }, {}]
    }
  };

  it('should be false when no names in store', function() {
    expect(hasNoRegisteredNames(stateWithNoName)).toBe(true);
  });

  it('should be true when name in snaps', function() {
    expect(hasNoRegisteredNames(stateWithName)).toBe(false);
  });

  it('should not memoize the selector', function() {
    expect(hasNoRegisteredNames.recomputations()).toBe(2);
  });

  it('should memoize the selector', function() {
    expect(hasNoRegisteredNames(stateWithName)).toBe(false);
    expect(hasNoRegisteredNames.recomputations()).toBe(2);
  });
});
