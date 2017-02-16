import expect from 'expect';

import { authStore } from '../../../../../src/common/reducers/auth-store';
import * as ActionTypes from '../../../../../src/common/actions/auth-store';

describe('authStore reducers', () => {
  const initialState = {
    isFetching: false,
    hasDischarge: false,
    authenticated: null,
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

  context('CHECK_SIGNED_INTO_STORE', () => {
    it('sets fetching status', () => {
      const action = { type: ActionTypes.CHECK_SIGNED_INTO_STORE };
      expect(authStore(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('CHECK_SIGNED_INTO_STORE_SUCCESS', () => {
    const state = {
      ...initialState,
      isFetching: true
    };

    context('if not authenticated', () => {
      const action = {
        type: ActionTypes.CHECK_SIGNED_INTO_STORE_SUCCESS,
        payload: false
      };

      it('clears fetching status', () => {
        expect(authStore(state, action).isFetching).toBe(false);
      });

      it('clears authenticated status', () => {
        expect(authStore(state, action).authenticated).toBe(false);
      });
    });

    context('if authenticated', () => {
      const action = {
        type: ActionTypes.CHECK_SIGNED_INTO_STORE_SUCCESS,
        payload: true
      };

      it('clears fetching status', () => {
        expect(authStore(state, action).isFetching).toBe(false);
      });

      it('sets authenticated status', () => {
        expect(authStore(state, action).authenticated).toBe(true);
      });
    });
  });

  context('CHECK_SIGNED_INTO_STORE_ERROR', () => {
    const state = {
      ...initialState,
      isFetching: true
    };
    const action = {
      type: ActionTypes.CHECK_SIGNED_INTO_STORE_ERROR,
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

  context('SIGN_OUT_OF_STORE_ERROR', () => {
    const action = {
      type: ActionTypes.SIGN_OUT_OF_STORE_ERROR,
      payload: 'Something went wrong!',
      error: true
    };

    it('stores error', () => {
      expect(authStore(initialState, action).error).toEqual(action.payload);
    });
  });
});
