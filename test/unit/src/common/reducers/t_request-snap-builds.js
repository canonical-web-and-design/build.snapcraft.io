import expect from 'expect';

import { requestSnapBuilds } from '../../../../../src/common/reducers/request-snap-builds';
import * as ActionTypes from '../../../../../src/common/actions/request-snap-builds';

import { snapBuildFromAPI } from '../../../../../src/common/helpers/snap-builds';

describe('requestSnapBuilds reducers', () => {
  const initialState = {
    isFetching: false,
    builds: [],
    success: false,
    error: null
  };

  const BUILD_ENTRIES = [{
    resource_type_link: 'https://api.launchpad.net/devel/#snap_build',
    self_link: 'https://api.launchpad.net/devel/~foo/+snap/bar/+build/1',
    buildstate: 'Needs building'
  }, {
    resource_type_link: 'https://api.launchpad.net/devel/#snap_build',
    self_link: 'https://api.launchpad.net/devel/~foo/+snap/bar/+build/2',
    buildstate: 'Needs building'
  }];

  it('should return the initial state', () => {
    expect(requestSnapBuilds(undefined, {})).toEqual(initialState);
  });

  context('REQUEST_BUILDS', () => {
    it('should store fetching status when requesting builds', () => {
      const action = {
        type: ActionTypes.REQUEST_BUILDS,
        payload: 'test'
      };

      expect(requestSnapBuilds(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('REQUEST_BUILDS_SUCCESS', () => {

    it('should stop fetching', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.REQUEST_BUILDS_SUCCESS,
        payload: BUILD_ENTRIES
      };

      expect(requestSnapBuilds(state, action).isFetching).toBe(false);
    });

    it('should store builds on request success', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.REQUEST_BUILDS_SUCCESS,
        payload: BUILD_ENTRIES
      };

      expect(requestSnapBuilds(state, action).builds)
        .toEqual(BUILD_ENTRIES.map(snapBuildFromAPI));
    });

    it('should store success state', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.REQUEST_BUILDS_SUCCESS,
        payload: BUILD_ENTRIES
      };

      expect(requestSnapBuilds(state, action).success).toBe(true);
    });

    it('should clean error', () => {
      const state = {
        ...initialState,
        error: 'Previous error'
      };

      const action = {
        type: ActionTypes.REQUEST_BUILDS_SUCCESS,
        payload: BUILD_ENTRIES
      };

      expect(requestSnapBuilds(state, action).error).toBe(null);
    });
  });

  context('REQUEST_BUILDS_ERROR', () => {
    it('should handle request builds failure', () => {
      const state = {
        ...initialState,
        success: true,
        builds: BUILD_ENTRIES,
        isFetching: true
      };

      const action = {
        type: ActionTypes.REQUEST_BUILDS_ERROR,
        payload: 'Something went wrong!',
        error: true
      };

      expect(requestSnapBuilds(state, action)).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      });
    });
  });
});
