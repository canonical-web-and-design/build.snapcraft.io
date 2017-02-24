import * as ActionTypes from '../actions/auth-store';

export function authStore(state = {
  isFetching: false,
  hasDischarge: false,
  authenticated: null,
  userName: null,
  signedAgreement: null,
  hasShortNamespace: null,
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
        signedAgreement: null,
        hasShortNamespace: null,
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
        signedAgreement: null,
        hasShortNamespace: null,
        error: null
      };
    case ActionTypes.CHECK_SIGNED_INTO_STORE_ERROR:
      return {
        ...state,
        isFetching: false,
        authenticated: false,
        signedAgreement: null,
        hasShortNamespace: null,
        error: action.payload
      };
    case ActionTypes.GET_ACCOUNT_INFO:
      return {
        ...state,
        isFetching: true,
        signedAgreement: null,
        hasShortNamespace: null
      };
    case ActionTypes.GET_ACCOUNT_INFO_SUCCESS:
      return {
        ...state,
        isFetching: false,
        signedAgreement: action.payload.signedAgreement,
        hasShortNamespace: action.payload.hasShortNamespace,
        error: null
      };
    case ActionTypes.GET_ACCOUNT_INFO_ERROR:
      return {
        ...state,
        isFetching: false,
        error: action.payload
      };
    case ActionTypes.SIGN_AGREEMENT_SUCCESS:
      return {
        ...state,
        signedAgreement: true
      };
    case ActionTypes.SIGN_OUT_OF_STORE_ERROR:
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}
