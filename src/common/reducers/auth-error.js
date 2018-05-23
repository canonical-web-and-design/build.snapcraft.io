import { AUTH_ERROR, AUTH_EXPIRED } from '../actions/auth-error';

export function authError(state = {}, action) {
  switch (action.type) {
    case AUTH_ERROR:
      return {
        ...state,
        message: action.message
      };
    case AUTH_EXPIRED:
      return {
        ...state,
        message: action.payload.error.json.payload.message,
        expired: true
      };
    default:
      return state;
  }
}
