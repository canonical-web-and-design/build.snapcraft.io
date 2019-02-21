import expect from 'expect';

import { snaps } from '../../../../../src/common/reducers/snaps';
import * as ActionTypes from '../../../../../src/common/actions/snaps';

describe('snaps reducers', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    ids: []
  };

  const SNAPS = [{
    gitRepoUrl: 'https://github.com/anowner/aname',
    selfLink: 'https://api.launchpad.net/devel/~anowner/+snap/blahblah',
    storeName: 'test-snap-store-name'
  },
  {
    gitRepoUrl: 'https://github.com/anowner/anothername',
    selfLink: 'https://api.launchpad.net/devel/~anowner/+snap/blahblahtest',
    storeName: 'test-snap-store-another-name'
  }];

  const IDS = SNAPS.map((snap) => snap.gitRepoUrl);

  it('should return the initial state', () => {
    expect(snaps(undefined, {})).toEqual(initialState);
  });

  context('FETCH_SNAPS', () => {
    const action = {
      type: ActionTypes.FETCH_SNAPS
    };

    it('should store fetching status', () => {
      expect(snaps(initialState, action).isFetching).toBe(true);
    });

    it('should clean success state', () => {
      expect(snaps(initialState, action).success).toBe(false);
    });

    it('should clean error', () => {
      expect(snaps(initialState, action).error).toBe(null);
    });
  });

  context('FETCH_SNAPS_SUCCESS', () => {
    const state = {
      ...initialState,
      isFetching: true,
      error: 'Previous error'
    };

    const action = {
      type: ActionTypes.FETCH_SNAPS_SUCCESS,
      payload: {
        response: {
          payload: {
            snaps: SNAPS,
            result: SNAPS.map((snap) => snap.gitRepoUrl)
          }
          // XXX
          // after partial refactoring of repositories it also now contains
          // entities: {},
          // result: []
          //
          // during final refactoring of snaps payload.snaps should be totally
          // replaced by entities and result
        }
      }
    };

    it('should stop fetching', () => {
      expect(snaps(state, action).isFetching).toBe(false);
    });

    it('should store success state', () => {
      expect(snaps(state, action).success).toBe(true);
    });

    it('should clean error', () => {
      expect(snaps(state, action).error).toBe(null);
    });

    it('should store result snap ids', () => {
      snaps(state, action).ids.forEach((id, i) => {
        expect(id).toEqual(SNAPS[i]['gitRepoUrl']);
      });
    });
  });

  context('FETCH_SNAPS_ERROR', () => {
    const state = {
      ...initialState,
      success: true,
      ids: IDS,
      isFetching: true
    };

    const action = {
      type: ActionTypes.FETCH_SNAPS_ERROR,
      payload: {
        error: 'Something went wrong!'
      },
      error: true
    };

    it('should handle fetch failure', () => {
      expect(snaps(state, action)).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload.error
      });
    });
  });

  context('REMOVE_SNAP', () => {
    const action = { type: ActionTypes.REMOVE_SNAP };

    it('stores fetching status', () => {
      expect(snaps(initialState, action).isFetching).toBe(true);
    });
  });

  context('REMOVE_SNAP_SUCCESS', () => {
    const state = {
      ...initialState,
      isFetching: true,
      ids: IDS,
      error: 'Previous error'
    };

    const action = {
      type: ActionTypes.REMOVE_SNAP_SUCCESS,
      payload: { repository_url: 'https://github.com/anowner/aname' }
    };

    it('clears fetching status', () => {
      expect(snaps(state, action).isFetching).toBe(false);
    });

    it('stores success status', () => {
      expect(snaps(state, action).success).toBe(true);
    });

    it('clears error', () => {
      expect(snaps(state, action).error).toBe(null);
    });

    it('removes snap id from state', () => {
      expect(snaps(state, action).ids).toExclude('https://github.com/anowner/aname');
    });


  });

  context('REMOVE_SNAP_ERROR', () => {
    const state = {
      ...initialState,
      isFetching: true,
      success: true,
      snaps: SNAPS
    };

    const action = {
      type: ActionTypes.REMOVE_SNAP_ERROR,
      payload: {
        error: 'Something went wrong!'
      },
      error: true
    };

    it('clears fetching status', () => {
      expect(snaps(state, action).isFetching).toBe(false);
    });

    it('clears success status', () => {
      expect(snaps(state, action).success).toBe(false);
    });

    it('stores error', () => {
      expect(snaps(state, action).error).toBe('Something went wrong!');
    });
  });
});
