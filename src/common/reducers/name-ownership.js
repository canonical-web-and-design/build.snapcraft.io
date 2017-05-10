import * as ActionTypes from '../actions/name-ownership';
import { NAME_OWNERSHIP_ALREADY_OWNED } from '../actions/name-ownership';
import { GET_ACCOUNT_INFO_SUCCESS } from '../actions/auth-store';

export function nameOwnership(state = {}, action) {
  const { payload } = action;

  switch(action.type) {
    case ActionTypes.CHECK_NAME_OWNERSHIP_REQUEST:
      return {
        ...state,
        [payload.name]: {
          ...state[payload.name],
          isFetching: true
        }
      };
    case ActionTypes.CHECK_NAME_OWNERSHIP_SUCCESS:
      return {
        ...state,
        [payload.name]: {
          ...state[payload.name],
          isFetching: false,
          status: payload.status,
          error: null
        }
      };
    case ActionTypes.CHECK_NAME_OWNERSHIP_ERROR:
      return {
        ...state,
        [payload.name]: {
          ...state[payload.name],
          isFetching: false,
          status: null,
          error: payload.error
        }
      };
    case GET_ACCOUNT_INFO_SUCCESS:
      if (payload.registeredNames) {
        return {
          ...state,
          ...payload.registeredNames.reduce((ownership, name) => {
            ownership[name] = {
              isFetching: false,
              status: NAME_OWNERSHIP_ALREADY_OWNED
            };
            return ownership;
          }, {})
        };
      }
      return state;
    default:
      return state;
  }
}
