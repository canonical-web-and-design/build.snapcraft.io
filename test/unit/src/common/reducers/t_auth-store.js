import expect from 'expect';

import { authStore } from '../../../../../src/common/reducers/auth-store';
import * as ActionTypes from '../../../../../src/common/actions/auth-store';

describe('authStore reducers', () => {
  const initialState = {
    isFetching: false,
    hasDischarge: false,
    authenticated: null,
    userName: null,
    signedAgreement: null,
    hasShortNamespace: null,
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

      it('clears signed-agreement status', () => {
        expect(authStore(state, action).signedAgreement).toBe(null);
      });

      it('clears has-short-namespace status', () => {
        expect(authStore(state, action).hasShortNamespace).toBe(null);
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

      it('clears signed-agreement status', () => {
        expect(authStore(state, action).signedAgreement).toBe(null);
      });

      it('clears has-short-namespace status', () => {
        expect(authStore(state, action).hasShortNamespace).toBe(null);
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

    it('clears signed-agreement status', () => {
      expect(authStore(state, action).signedAgreement).toBe(null);
    });

    it('clears has-short-namespace status', () => {
      expect(authStore(state, action).hasShortNamespace).toBe(null);
    });

    it('stores error', () => {
      expect(authStore(state, action).error).toEqual(action.payload);
    });
  });

  context('GET_ACCOUNT_INFO', () => {
    const state = {
      ...initialState,
      signedAgreement: 'sentinel',
      hasShortNamespace: 'sentinel'
    };
    const action = { type: ActionTypes.GET_ACCOUNT_INFO };

    it('sets fetching status', () => {
      expect(authStore(state, action).isFetching).toBe(true);
    });

    it('clears signed-agreement status', () => {
      expect(authStore(state, action).signedAgreement).toBe(null);
    });

    it('clears has-short-namespace status', () => {
      expect(authStore(state, action).hasShortNamespace).toBe(null);
    });
  });

  context('GET_ACCOUNT_INFO_SUCCESS', () => {
    const state = {
      ...initialState,
      isFetching: true
    };
    const action = {
      type: ActionTypes.GET_ACCOUNT_INFO_SUCCESS,
      payload: {
        signedAgreement: 'sentinel-1',
        hasShortNamespace: 'sentinel-2'
      }
    };

    it('clears fetching status', () => {
      expect(authStore(state, action).isFetching).toBe(false);
    });

    it('copies signed-agreement status', () => {
      expect(authStore(state, action).signedAgreement).toBe('sentinel-1');
    });

    it('copies has-short-namespace status', () => {
      expect(authStore(state, action).hasShortNamespace).toBe('sentinel-2');
    });
  });

  context('GET_ACCOUNT_INFO_ERROR', () => {
    const state = {
      ...initialState,
      isFetching: true
    };
    const action = {
      type: ActionTypes.GET_ACCOUNT_INFO_ERROR,
      payload: 'Something went wrong!',
      error: true
    };

    it('clears fetching status', () => {
      expect(authStore(state, action).isFetching).toBe(false);
    });

    it('stores error', () => {
      expect(authStore(state, action).error).toEqual(action.payload);
    });
  });

  context('SIGN_AGREEMENT_SUCCESS', () => {
    it('sets signed-agreement status', () => {
      const action = { type: ActionTypes.SIGN_AGREEMENT_SUCCESS };
      expect(authStore(initialState, action).signedAgreement).toBe(true);
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
