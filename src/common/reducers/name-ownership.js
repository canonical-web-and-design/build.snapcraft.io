import * as RegisterNameActionTypes from '../actions/register-name';

export function nameOwnership(state = {}, action) {
  const { payload } = action;

  switch(action.type) {
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_REQUEST:
      return {
        ...state,
        [payload.name]: {
          ...state[payload.name],
          isFetching: true
        }
      };
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_SUCCESS:
      return {
        ...state,
        [payload.name]: {
          ...state[payload.name],
          isFetching: false,
          nameOwnershipStatus: payload.status
        }
      };
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_ERROR:
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
