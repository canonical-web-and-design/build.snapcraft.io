import expect from 'expect';

import { user } from '../../../../../src/common/reducers/user';
import * as ActionTypes from '../../../../../src/common/actions/user';

describe('user reducers', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    user: null,
  };

  const USER = {
    login: 'johndoe',
    name: 'John Doe',
  };

  it('should return the initial state', () => {
    expect(user(undefined, {})).toEqual(initialState);
  });

  context('FETCH_SNAPS', () => {
    const action = {
      type: ActionTypes.FETCH_USER
    };

    it('should store fetching status when fetching builds', () => {
      expect(user(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('SET_USER', () => {
    const state = {
      ...initialState,
      isFetching: true,
      error: 'Previous error'
    };

    const action = {
      type: ActionTypes.SET_USER,
      payload: USER
    };

    it('should stop fetching', () => {
      expect(user(state, action).isFetching).toBe(false);
    });

    it('should store success state', () => {
      expect(user(state, action).success).toBe(true);
    });

    it('should clean error', () => {
      expect(user(state, action).error).toBe(null);
    });

    it('should store user data', () => {
      expect(user(state, action).user).toEqual(USER);
    });
  });


  context('FETCH_USER_ERROR', () => {
    const state = {
      ...initialState,
      success: true,
      repos: USER,
      isFetching: true
    };

    const action = {
      type: ActionTypes.FETCH_USER_ERROR,
      payload: 'Something went wrong!',
      error: true
    };

    it('should handle fetch failure', () => {
      expect(user(state, action)).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      });
    });
  });
});
