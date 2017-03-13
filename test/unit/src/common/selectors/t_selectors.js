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

  // XXX must run first in suite to avoid memoizing a selector and being
  // off-by-one in recomputations()
  context('is a memoized selector', function() {
    beforeEach(function() {
      hasNoRegisteredNames.resetRecomputations();
    });

    it('and should recompute the value on new state', function() {
      expect(hasNoRegisteredNames.recomputations()).toBe(0);
      hasNoRegisteredNames(stateWithName);
      expect(hasNoRegisteredNames.recomputations()).toBe(1);
      hasNoRegisteredNames(stateWithNoName);
      expect(hasNoRegisteredNames.recomputations()).toBe(2);
    });

    it('and should not recompute the value on same state', function() {
      hasNoRegisteredNames(stateWithNoName);
      hasNoRegisteredNames(stateWithNoName);
      hasNoRegisteredNames(stateWithNoName);
      expect(hasNoRegisteredNames.recomputations()).toBe(0);
    });
  });

  context('that checks if any registered names in state', function() {
    it('should be false when no names in state', function() {
      expect(hasNoRegisteredNames(stateWithNoName)).toBe(true);
    });

    it('should be true when a name in state', function() {
      expect(hasNoRegisteredNames(stateWithName)).toBe(false);
    });
  });
});
