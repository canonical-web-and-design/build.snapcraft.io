import expect from 'expect';

import { hasNamedSnaps } from '../../../../../src/common/selectors';

describe('hasNamedSnaps', function() {

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
    expect(hasNamedSnaps(stateWithNoName)).toBe(false);
    expect(hasNamedSnaps.recomputations()).toBe(1);
  });

  it('should be true when name in snaps', function() {
    expect(hasNamedSnaps(stateWithName)).toBe(true);
    expect(hasNamedSnaps.recomputations()).toBe(2);
  });

  it('should memoize the selector', function() {
    expect(hasNamedSnaps(stateWithName)).toBe(true);
    expect(hasNamedSnaps.recomputations()).toBe(2);
  });
});
