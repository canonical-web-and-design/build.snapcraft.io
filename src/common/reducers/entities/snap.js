import * as RegisterNameActionTypes from '../../actions/register-name';

export default function snap(state={}, action) {
  switch(action.type) {
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_REQUEST:
      return {
        ...state,
        snapcraft_data: {
          ...state.snapcraft_data,
          isFetching: true
        }
      };
    case RegisterNameActionTypes.CHECK_NAME_OWNERSHIP_SUCCESS:
      return {
        ...state,
        snapcraft_data: {
          ...state.snapcraft_data,
          isFetching: false,
          nameOwnershipStatus: action.payload.status
        }
      };
    case RegisterNameActionTypes.REGISTER_NAME_SUCCESS:
      return {
        ...state,
        store_name: action.payload.snapName
      };
    default:
      return state;
  }
}
