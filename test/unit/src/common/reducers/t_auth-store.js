import expect from 'expect';

import { authStore } from '../../../../../src/common/reducers/auth-store';
import * as ActionTypes from '../../../../../src/common/actions/auth-store';

describe('authStore reducers', () => {
  const initialState = {
    isFetching: false,
    hasDischarge: false,
    authenticated: false,
    error: null
  };

  it('returns the initial state', () => {
    expect(authStore(undefined, {})).toEqual(initialState);
  });

  context('GET_SSO_DISCHARGE', () => {
    it('sets fetching status', () => {
      const action = { type: ActionTypes.GET_SSO_DISCHARGE };
      expect(authStore(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('GET_SSO_DISCHARGE_SUCCESS', () => {
    const state = {
      ...initialState,
      isFetching: true
    };
    const action = { type: ActionTypes.GET_SSO_DISCHARGE_SUCCESS };

    it('clears fetching status', () => {
      expect(authStore(state, action).isFetching).toBe(false);
    });

    it('clears has-discharge status', () => {
      expect(authStore(state, action).hasDischarge).toBe(false);
    });

    it('sets authenticated status', () => {
      expect(authStore(state, action).authenticated).toBe(true);
    });
  });

  context('GET_SSO_DISCHARGE_ERROR', () => {
    const state = {
      ...initialState,
      isFetching: true
    };
    const action = {
      type: ActionTypes.GET_SSO_DISCHARGE_ERROR,
      payload: 'Something went wrong!',
      error: true
    };

    it('clears fetching status', () => {
      expect(authStore(state, action).isFetching).toBe(false);
    });

    it('clears has-discharge status', () => {
      expect(authStore(state, action).hasDischarge).toBe(false);
    });

    it('stores error', () => {
      expect(authStore(state, action).error).toEqual(action.payload);
    });
  });
});
