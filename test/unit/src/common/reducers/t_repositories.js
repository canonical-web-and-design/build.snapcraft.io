import expect from 'expect';

import { repositories } from '../../../../../src/common/reducers/repositories';
import * as ActionTypes from '../../../../../src/common/actions/repositories';


describe('repositories reducers', () => {
  const initialState = {
    isFetching: false,
    pageLinks: {},
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
      error: 'Previous error'
    };

    const action = {
      type: ActionTypes.REPOSITORIES_SUCCESS,
      payload: {
        ids
      }
    };

    it('should stop fetching', () => {
      expect(repositories(state, action).isFetching).toBe(false);
    });

    it('should clean error', () => {
      expect(repositories(state, action).error).toBe(null);
    });
  });

  context('REPOSITORIES_FAILURE', () => {
    const state = {
      ...initialState,
      ids,
      isFetching: true
    };

    const action = {
      type: ActionTypes.REPOSITORIES_FAILURE,
      payload: 'Something went wrong!',
      error: true
    };

    it('should handle fetch failure', () => {
      expect(repositories(state, action)).toEqual({
        ...state,
        isFetching: false,
        error: action.payload
      });
    });
  });
});
