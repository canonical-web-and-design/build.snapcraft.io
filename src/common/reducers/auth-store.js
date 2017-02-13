import * as ActionTypes from '../actions/auth-store';

export function authStore(state = {
  isFetching: false,
  hasDischarge: false,
  authenticated: false,
  error: null
}, action) {
  switch (action.type) {
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
    default:
      return state;
  }
}
