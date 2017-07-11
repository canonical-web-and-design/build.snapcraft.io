import expect from 'expect';

import { repositories } from '../../../../../src/common/reducers/repositories';
import * as ActionTypes from '../../../../../src/common/actions/repositories';


describe('repositories reducers', () => {
  const initialState = {
    isFetching: false,
    isDelayed: false,
    pageLinks: {},
    searchTerm: '',
    error: null,
    ids: []
  };

  const ids = ['foo', 'bar', 'baz'];

  it('should return the initial state', () => {
    expect(repositories(undefined, {})).toEqual(initialState);
  });

  context('REPOSITORIES_REQUEST', () => {
    const action = {
      type: ActionTypes.REPOSITORIES_REQUEST,
      payload: 'test'
    };

    it('should store fetching status when fetching builds', () => {
      expect(repositories(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('REPOSITORIES_SUCCESS', () => {
    const state = {
      ...initialState,
      isFetching: true,
      isDelayed: true,
      error: 'Previous error'
    };

    const action = {
      type: ActionTypes.REPOSITORIES_SUCCESS,
      payload: {
        response: {
          ids
        }
      }
    };

    it('should stop fetching', () => {
      expect(repositories(state, action).isFetching).toBe(false);
    });

    it('should clean error', () => {
      expect(repositories(state, action).error).toBe(null);
    });

    it('should clear delayed flag', () => {
      expect(repositories(state, action).isDelayed).toBe(false);
    });
  });

  context('REPOSITORIES_FAILURE', () => {
    const state = {
      ...initialState,
      ids,
      isFetching: true,
      isDelayed: true
    };

    const action = {
      type: ActionTypes.REPOSITORIES_FAILURE,
      payload: {
        error: 'Something went wrong!'
      },
      error: true
    };

    it('should stop fetching', () => {
      expect(repositories(state, action).isFetching).toBe(false);
    });

    it('should set error', () => {
      expect(repositories(state, action).error).toBe(action.payload.error);
    });

    it('should clear isDelayed flag', () => {
      expect(repositories(state, action).isDelayed).toBe(false);
    });
  });

  context('REPOSITORIES_DELAYED', () => {
    const state = {
      ...initialState
    };

    const action = {
      type: ActionTypes.REPOSITORIES_DELAYED
    };

    it('should handle delayed response', () => {
      expect(repositories(state, action)).toEqual({
        ...state,
        isDelayed: true
      });
    });
  });

  context('REPOSITORIES_SEARCH', () => {
    const state = {
      ...initialState
    };

    const action = {
      type: ActionTypes.REPOSITORIES_SEARCH,
      payload: 'test'
    };

    it('should store search term', () => {
      expect(repositories(state, action)).toEqual({
        ...state,
        searchTerm: 'test'
      });
    });
  });
});
