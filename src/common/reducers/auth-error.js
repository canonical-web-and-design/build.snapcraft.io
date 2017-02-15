import { AUTH_ERROR } from '../actions/auth-error';

export function authError(state = {}, action) {
  switch (action.type) {
    case AUTH_ERROR:
      return {
        ...state,
        message: action.message
      };
    default:
      return state;
  }
}
