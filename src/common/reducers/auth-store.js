import * as ActionTypes from '../actions/auth-store';

export function authStore(state = {
  isFetching: false,
  hasDischarge: false,
  authenticated: null,
  error: null
}, action) {
  switch (action.type) {
    case ActionTypes.SIGN_INTO_STORE:
      return {
        ...state,
        isFetching: true,
        authenticated: false
      };
    case ActionTypes.SIGN_INTO_STORE_SUCCESS:
      return {
        ...state,
        isFetching: false,
        error: null
      };
    case ActionTypes.SIGN_INTO_STORE_ERROR:
      return {
        ...state,
        isFetching: false,
        error: action.payload
      };
    case ActionTypes.GET_SSO_DISCHARGE:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.GET_SSO_DISCHARGE_SUCCESS:
      return {
        ...state,
        isFetching: false,
        hasDischarge: false,
        authenticated: true,
        error: null
      };
    case ActionTypes.GET_SSO_DISCHARGE_ERROR:
      return {
        ...state,
        isFetching: false,
        hasDischarge: false,
        error: action.payload
      };
    case ActionTypes.CHECK_SIGNED_INTO_STORE:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.CHECK_SIGNED_INTO_STORE_SUCCESS:
      return {
        ...state,
        isFetching: false,
        authenticated: action.payload,
        error: null
      };
    case ActionTypes.CHECK_SIGNED_INTO_STORE_ERROR:
      return {
        ...state,
        isFetching: false,
        authenticated: false,
        error: action.payload
      };
    default:
      return state;
  }
}
