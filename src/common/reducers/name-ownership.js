import * as ActionTypes from '../actions/name-ownership';

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
          nameOwnershipStatus: payload.status
        }
      };
    case ActionTypes.CHECK_NAME_OWNERSHIP_ERROR:
      return {
        ...state,
        [payload.name]: {
          ...state[payload.name],
          isFetching: false,
          nameOwnershipStatus: null
        }
      };
    default:
      return state;
  }
}
