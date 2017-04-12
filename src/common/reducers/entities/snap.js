import * as RegisterNameActionTypes from '../../actions/register-name';

export default function snap(state={}, action) {
  switch(action.type) {
    case RegisterNameActionTypes.REGISTER_NAME_SUCCESS:
      return {
        ...state,
        store_name: action.payload.snapName
      };
    default:
      return state;
  }
}
