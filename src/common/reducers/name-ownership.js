import * as RegisterNameActionTypes from '../actions/register-name';

export function nameOwnership(state = {}, action) {
  const { payload } = action;

  switch(action.type) {
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_REQUEST:
      return {
        ...state,
        [payload.snapName]: {
          ...state[payload.snapName],
          isFetching: true
        }
      };
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_SUCCESS:
      return {
        ...state,
        [payload.snapName]: {
          ...state[payload.snapName],
          isFetching: false,
          nameOwnershipStatus: payload.status
        }
      };
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_ERROR:
      return {
        ...state,
        [payload.snapName]: {
          ...state[payload.snapName],
          isFetching: false,
          nameOwnershipStatus: null
        }
      };
    default:
      return state;
  }
}
