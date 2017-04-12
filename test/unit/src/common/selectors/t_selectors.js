import expect from 'expect';

import {
  hasSnaps,
  hasNoSnaps,
  hasNoRegisteredNames,
  hasNoConfiguredSnaps,
  hasLoadedSnaps,
  snapsWithRegisteredNameAndSnapcraftData,
  snapsWithRegisteredNameAndNoSnapcraftData,
  snapsWithNoBuilds,
  isAddingSnaps
} from '../../../../../src/common/selectors';

describe('selectors', function() {

  const stateWithNoSnaps = {
    snaps: {
      ids: []
    },
    entities: {
      snaps: {}
    }
  };

  const stateWithNoName = {
    snaps: {
      ids: ['https:github.com/anowner/aname', 'https:github.com/anowner/aname-i']
    },
    entities: {
      snaps: {
        'https:github.com/anowner/aname': {
          git_repository_url: 'https:github.com/anowner/aname'
        },
        'https:github.com/anowner/aname-i': {
          git_repository_url: 'https:github.com/anowner/aname-i'
        }
      }
    }
  };

  const stateWithName = {
    snaps: {
      ids: ['https:github.com/anowner/aname']
    },
    entities: {
      snaps: {
        'https:github.com/anowner/aname': {
          store_name: 'bsi-test-ii',
          git_repository_url: 'https:github.com/anowner/aname'
        }
      }
    }
  };

  const stateWithSnapcraftData = {
    snaps: {
      ids: ['https:github.com/anowner/aname']
    },
    entities: {
      snaps: {
        'https:github.com/anowner/aname': {
          store_name: 'bsi-test-ii',
          snapcraft_data: { name: 'bsi-test-ii' },
          git_repository_url: 'https:github.com/anowner/aname'
        }
      }
    }
  };

  context('hasSnaps', function() {
    it('should be false when no snaps in state', function() {
      expect(hasSnaps(stateWithNoSnaps)).toBe(false);
    });

    it('should be true when snaps are in state', function() {
      expect(hasSnaps(stateWithName)).toBe(true);
    });
  });

  context('hasNoSnaps', function() {
    it('should be true when no snaps in state', function() {
      expect(hasNoSnaps(stateWithNoSnaps)).toBe(true);
    });

    it('should be false when snaps are in state', function() {
      expect(hasNoSnaps(stateWithName)).toBe(false);
    });
  });

  context('hasNoRegisteredNames', function() {
    it('should be true when no snaps in state', function() {
      expect(hasNoRegisteredNames(stateWithNoSnaps)).toBe(true);
    });

    it('should be true when no names in state', function() {
      expect(hasNoRegisteredNames(stateWithNoName)).toBe(true);
    });

    it('should be false when a name in state', function() {
      expect(hasNoRegisteredNames(stateWithName)).toBe(false);
    });
  });

  context('hasNoConfiguredSnaps', function() {
    it('should be true when no snaps in state', function() {
      expect(hasNoConfiguredSnaps(stateWithNoSnaps)).toBe(true);
    });

    it('should be true when no snapcraft data in state', function() {
      expect(hasNoConfiguredSnaps(stateWithNoName)).toBe(true);
    });

    it('should be false when snapcraft data is in state', function() {
      expect(hasNoConfiguredSnaps(stateWithSnapcraftData)).toBe(false);
    });
  });

  context('hasLoadedSnaps', function() {
    const stateWithSnapsNotLoaded = {
      snaps: {
        success: false,
        ids: []
      }
    };

    const stateWithSnapsLoaded = {
      snaps: {
        success: true,
        ids: []
      }
    };

    it('should be false when snaps not yet loaded', function() {
      expect(hasLoadedSnaps(stateWithSnapsNotLoaded)).toBe(false);
    });

    it('should be true when snaps were already loaded', function() {
      expect(hasLoadedSnaps(stateWithSnapsLoaded)).toBe(true);
    });

  });

  context('snapsWithRegisteredNameAndSnapcraftData', function() {
    const stateWithNameAndSnapcraftData = {
      snaps: {
        ids: [
          'https:github.com/anowner/aname',
          'https:github.com/anowner/aname-i'
        ]
      },
      entities: {
        snaps: {
          'https:github.com/anowner/aname': {
            store_name: 'bsi-test-ii',
            snapcraft_data: { name: 'bsi-test-ii' }
          },
          'https:github.com/anowner/aname-i': {}
        }
      }
    };

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
        ids: [
          'https:github.com/anowner/aname',
          'https:github.com/anowner/aname-i'
        ]
      },
      entities: {
        snaps: {
          'https:github.com/anowner/aname': {
            store_name: 'bsi-test-ii',
            snapcraft_data: { name: 'bsi-test-ii' }
          },
          'https:github.com/anowner/aname-i': {
            store_name: 'bsi-test-iii'
          }
        }
      }
    };

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
        ids: [
          'https://github.com/test/bsi-test',
          'https://github.com/test/bsi-test-iii'
        ]
      },
      entities: {
        snaps: {
          'https://github.com/test/bsi-test': {
            store_name: 'bsi-test-ii',
            git_repository_url: 'https://github.com/test/bsi-test',
            snapcraft_data: { name: 'bsi-test-ii' }
          },
          'https://github.com/test/bsi-test-iii': {
            store_name: 'bsi-test-iii',
            git_repository_url: 'https://github.com/test/bsi-test-iii',
            snapcraft_data: { name: 'bsi-test-iii' }
          }
        }
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
      entities: {
        repos: {}
      },
      repositories: {
        ids: []
      }
    };

    const stateNotFetching = {
      entities: {
        repos: {
          1001: {
            isFetching: false
          }
        }
      },
      repositories: {
        ids: [1001]
      }
    };

    const stateFetching = {
      entities: {
        repos: {
          1001: {
            isFetching: true
          }
        }
      },
      repositories: {
        ids: [1001]
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
