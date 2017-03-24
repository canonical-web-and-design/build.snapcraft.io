import expect from 'expect';

import {
  hasSnaps,
  hasNoSnaps,
  hasNoRegisteredNames,
  snapsWithRegisteredNameAndSnapcraftData,
  snapsWithRegisteredNameAndNoSnapcraftData,
  snapsWithNoBuilds,
  isAddingSnaps
} from '../../../../../src/common/selectors';

describe('selectors', function() {

  const stateWithNullSnaps = {
    snaps: {
      snaps: null
    }
  };

  const stateWithNoSnaps = {
    snaps: {
      snaps: []
    }
  };

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

  context('hasSnaps', function() {
    it('should be false when snaps are null in state', function() {
      expect(hasSnaps(stateWithNullSnaps)).toBe(false);
    });

    it('should be false when no snaps in state', function() {
      expect(hasSnaps(stateWithNoSnaps)).toBe(false);
    });

    it('should be true when snaps are in state', function() {
      expect(hasSnaps(stateWithName)).toBe(true);
    });
  });

  context('hasNoSnaps', function() {
    it('should be true when snaps are null in state', function() {
      expect(hasNoSnaps(stateWithNullSnaps)).toBe(true);
    });

    it('should be true when no snaps in state', function() {
      expect(hasNoSnaps(stateWithNoSnaps)).toBe(true);
    });

    it('should be false when snaps are in state', function() {
      expect(hasNoSnaps(stateWithName)).toBe(false);
    });
  });

  context('hasNoRegisteredNames', function() {
    it('should be true when snaps are null in state', function() {
      expect(hasNoRegisteredNames(stateWithNullSnaps)).toBe(true);
    });

    it('should be true when no names in state', function() {
      expect(hasNoRegisteredNames(stateWithNoName)).toBe(true);
    });

    it('should be false when a name in state', function() {
      expect(hasNoRegisteredNames(stateWithName)).toBe(false);
    });
  });

  context('snapsWithRegisteredNameAndSnapcraftData', function() {
    const stateWithNameAndSnapcraftData = {
      snaps: {
        snaps: [{
          store_name: 'bsi-test-ii',
          snapcraft_data: { name: 'bsi-test-ii' }
        }, {}]
      }
    };

    it('should be empty when snaps are null in state', function() {
      expect(snapsWithRegisteredNameAndSnapcraftData(stateWithNullSnaps)).toEqual([]);
    });

    it('should be empty when no snaps in state', function() {
      expect(snapsWithRegisteredNameAndSnapcraftData(stateWithNoSnaps)).toEqual([]);
    });

    it('should include snap with name and snapcraft data', function() {
      const snaps = snapsWithRegisteredNameAndSnapcraftData(stateWithNameAndSnapcraftData);
      expect(snaps.length).toBe(1);
      expect(snaps).toInclude({
        store_name: 'bsi-test-ii',
        snapcraft_data: { name: 'bsi-test-ii' }
      });
    });
  });

  context('snapsWithRegisteredNameAndNoSnapcraftData', function() {
    const stateWithNameAndNoSnapcraftData = {
      snaps: {
        snaps: [{
          store_name: 'bsi-test-ii',
          snapcraft_data: { name: 'bsi-test-ii' }
        }, {
          store_name: 'bsi-test-iii'
        }]
      }
    };

    it('should be empty when snaps are null in state', function() {
      expect(snapsWithRegisteredNameAndNoSnapcraftData(stateWithNullSnaps)).toEqual([]);
    });

    it('should be empty when no snaps in state', function() {
      expect(snapsWithRegisteredNameAndNoSnapcraftData(stateWithNoSnaps)).toEqual([]);
    });

    it('should include snap with name and no snapcraft data', function() {
      const snaps = snapsWithRegisteredNameAndNoSnapcraftData(stateWithNameAndNoSnapcraftData);
      expect(snaps.length).toBe(1);
      expect(snaps).toInclude({
        store_name: 'bsi-test-iii'
      });
    });
  });

  context('snapsWithNoBuilds', function() {
    const stateWithBuilds = {
      snaps: {
        snaps: [{
          store_name: 'bsi-test-ii',
          git_repository_url: 'https://github.com/test/bsi-test',
          snapcraft_data: { name: 'bsi-test-ii' }
        }, {
          store_name: 'bsi-test-iii',
          git_repository_url: 'https://github.com/test/bsi-test-iii',
          snapcraft_data: { name: 'bsi-test-iii' }
        }]
      },
      snapBuilds: {
        'test/bsi-test': {
          success: true,
          builds: [{}]
        },
        'test/bsi-test-iii': {
          success: true,
          builds: []
        },
      }
    };

    it('should be empty when snaps are null in state', function() {
      expect(snapsWithNoBuilds(stateWithNullSnaps)).toEqual([]);
    });

    it('should be empty when no snaps in state', function() {
      expect(snapsWithNoBuilds(stateWithNoSnaps)).toEqual([]);
    });

    it('should return snaps with no builds', function() {
      const snaps = snapsWithNoBuilds(stateWithBuilds);
      expect(snaps.length).toBe(1);
      expect(snaps).toInclude({
        store_name: 'bsi-test-iii',
        git_repository_url: 'https://github.com/test/bsi-test-iii',
        snapcraft_data: { name: 'bsi-test-iii' }
      });
    });
  });

  context('isAddingSnaps', function() {
    const stateNoRepos = {
      repositoriesStatus: {}
    };

    const stateNotFetching = {
      repositoriesStatus: {
        'foo/bar': {
          isFetching: false,
          error: null,
          success: false
        }
      }
    };

    const stateFetching = {
      repositoriesStatus: {
        'foo/bar': {
          isFetching: true,
          error: null,
          success: false
        }
      }
    };

    it('should be false when no repo have status', function() {
      expect(isAddingSnaps(stateNoRepos)).toBe(false);
    });

    it('should be false when no snaps are being created', function() {
      expect(isAddingSnaps(stateNotFetching)).toBe(false);
    });

    it('should be true if any snap is currently fetching', function() {
      expect(isAddingSnaps(stateFetching)).toBe(true);
    });


  });

});
