import expect from 'expect';

import { hasNoRegisteredNames } from '../../../../../src/common/selectors';

describe('hasNoRegisteredNames selector', function() {

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

  context('checks if any registered names are in state', function() {
    it('should be false when no names in state', function() {
      expect(hasNoRegisteredNames(stateWithNoName)).toBe(true);
    });

    it('should be true when a name in state', function() {
      expect(hasNoRegisteredNames(stateWithName)).toBe(false);
    });
  });
});
