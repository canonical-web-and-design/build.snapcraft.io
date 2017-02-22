import expect from 'expect';

import { snaps } from '../../../../../src/common/reducers/snaps';
import * as ActionTypes from '../../../../../src/common/actions/snaps';

describe('snaps reducers', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    snaps: null,
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

    it('should stop fetching', () => {
      expect(snaps(state, action).isFetching).toBe(false);
    });

    it('should store success state', () => {
      expect(snaps(state, action).success).toBe(true);
    });

    it('should clean error', () => {
      expect(snaps(state, action).error).toBe(null);
    });

    it('should store full snap info', () => {
      snaps(state, action).snaps.forEach((snap, i) => {
        expect(snap).toEqual(SNAPS[i]);
      });
    });
  });


  context('FETCH_SNAPS_ERROR', () => {
    const state = {
      ...initialState,
      success: true,
      repos: SNAPS,
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
});
