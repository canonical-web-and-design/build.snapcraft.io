import * as ActionTypes from '../actions/user';

export function user(state = {
  isFetching: false,
  user: null,
  success: false,
  error: null
}, action) {
  switch (action.type) {
    case ActionTypes.FETCH_USER:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.SET_USER:
      return {
        ...state,
        isFetching: false,
        success: true,
        user: action.payload,
        error: null
      };
    case ActionTypes.FETCH_USER_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        user: null,
        error: action.payload
      };
    default:
      return state;
  }
}
