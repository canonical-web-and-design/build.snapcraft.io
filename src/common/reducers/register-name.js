import * as ActionTypes from '../actions/register-name';

export function registerName(state = {}, action) {
  const { payload } = action;

  const initialStatus = {
    snapName: null,
    isFetching: false,
    success: false,
    error: null
  };

  switch (action.type) {
    case ActionTypes.REGISTER_NAME:
      return {
        ...state,
        [payload.id]: {
          ...initialStatus,
          snapName: payload.snapName,
          isFetching: true
        }
      };
    case ActionTypes.REGISTER_NAME_SUCCESS:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          isFetching: false,
          success: true,
          error: null
        }
      };
    case ActionTypes.REGISTER_NAME_ERROR:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          isFetching: false,
          success: false,
          error: payload.error
        }
      };
    default:
      return state;
  }
}
