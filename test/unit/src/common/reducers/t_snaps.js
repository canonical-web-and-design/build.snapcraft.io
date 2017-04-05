import expect from 'expect';

import { snaps } from '../../../../../src/common/reducers/snaps';
import * as ActionTypes from '../../../../../src/common/actions/snaps';
import * as RegisterNameActionTypes from '../../../../../src/common/actions/register-name';

describe('snaps reducers', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    snaps: null,
    ids: []
  };

  const SNAPS = [{
    builds_collection_link: 'https://api.launchpad.net/devel/~anowner/+snap/blahblah-xenial/builds',
    git_repository_url: 'https://github.com/anowner/aname',
    resource_type_link: 'https://api.launchpad.net/devel/#snap',
    self_link: 'https://api.launchpad.net/devel/~anowner/+snap/blahblah-xenial',
    store_name: 'test-snap-store-name'
  },
  {
    builds_collection_link: 'https://api.launchpad.net/devel/~anowner/+snap/blahblahtest-xenial/builds',
    git_repository_url: 'https://github.com/anowner/anothername',
    resource_type_link: 'https://api.launchpad.net/devel/#snap',
    self_link: 'https://api.launchpad.net/devel/~anowner/+snap/blahblahtest-xenial',
    store_name: 'test-snap-store-another-name'
  }];

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
      payload: SNAPS
    };

    xit('should stop fetching', () => {
      expect(snaps(state, action).isFetching).toBe(false);
    });

    xit('should store success state', () => {
      expect(snaps(state, action).success).toBe(true);
    });

    xit('should clean error', () => {
      expect(snaps(state, action).error).toBe(null);
    });

    xit('should store full snap info', () => {
      snaps(state, action).snaps.forEach((snap, i) => {
        expect(snap).toEqual(SNAPS[i]);
      });
    });
  });

  context('FETCH_SNAPS_ERROR', () => {
    const state = {
      ...initialState,
      success: true,
      snaps: SNAPS,
      isFetching: true
    };

    const action = {
      type: ActionTypes.FETCH_SNAPS_ERROR,
      payload: 'Something went wrong!',
      error: true
    };

    it('should handle fetch failure', () => {
      expect(snaps(state, action)).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      });
    });
  });

  context('REGISTER_NAME_SUCCESS', () => {
    const state = {
      ...initialState,
      success: true,
      snaps: SNAPS,
      isFetching: true
    };

    const action = {
      type: RegisterNameActionTypes.REGISTER_NAME_SUCCESS,
      payload: {
        id: 'anowner/anothername',
        snapName: 'new-test-snap-name'
      }
    };

    it('should update store_name of given snap', () => {
      expect(snaps(state, action).snaps[0].store_name).toBe('test-snap-store-name');
      expect(snaps(state, action).snaps[1].store_name).toBe('new-test-snap-name');
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
      snaps: SNAPS,
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

    it('removes snap from state', () => {
      expect(snaps(state, action).snaps.map((snap) => {
        return snap.git_repository_url;
      })).toEqual(['https://github.com/anowner/anothername']);
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
        repository_url: 'https://github.com/anowner/aname',
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
