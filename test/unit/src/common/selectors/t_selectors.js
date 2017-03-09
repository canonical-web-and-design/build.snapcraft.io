import expect from 'expect';

import { hasNamedSnaps } from '../../../../../src/common/selectors';

describe('hasNamedSnaps', function() {

  const state = {
    snaps: {
      isFetching: false,
      success: true,
      error: null,
      snaps: [{
        git_repository_url: 'https://github.com/earnubs/bsi-test-ii'
      }, {
        git_repository_url: 'https://github.com/earnubs/bsi-test-iii'
      }]
    },
    registerName: {}
  };

  it('should be false when no names in store', function() {
    expect(hasNamedSnaps(state)).toBe(false);
    expect(hasNamedSnaps.recomputations()).toBe(1);
  });

  it('should be true when matching names in registerName', function() {
    state.registerName = {
      'earnubs/bsi-test-ii': {
        success: true
      }
    }
    expect(hasNamedSnaps(state)).toBe(true);
    expect(hasNamedSnaps.recomputations()).toBe(2);
  });

  it('should be true when name in snaps', function() {
    state.registerName = {};
    state.snaps.snaps[1].store_name = "bsi-test-iii";
    expect(hasNamedSnaps(state)).toBe(true);
    expect(hasNamedSnaps.recomputations()).toBe(3);
  });

  it('should be true when name in either', function() {
    state.registerName = {
      'earnubs/bsi-test-ii': {
        success: true
      }
    };
    state.snaps.snaps[1].store_name = "bsi-test-iii";
    expect(hasNamedSnaps(state)).toBe(true);
    expect(hasNamedSnaps.recomputations()).toBe(4);
  });

  it('should memoize the selector', function() {
    expect(hasNamedSnaps.recomputations()).toBe(4);
  });
});
