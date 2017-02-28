import * as ActionTypes from '../actions/create-snap';

export function repositoriesStatus(state = {}, action) {
  const { payload } = action;

  const initialStatus = {
    isFetching: false,
    success: false,
    error: null
  };

  switch(action.type) {
    case ActionTypes.CREATE_SNAPS_CLEAR:
      return {};
    case ActionTypes.CREATE_SNAP:
      return {
        ...state,
        [payload.id]: {
          ...initialStatus,
          ...state[payload.id],
          isFetching: true
        }
      };
    case ActionTypes.CREATE_SNAP_SUCCESS:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          isFetching: false,
          success: true,
          error: null
        }
      };
    case ActionTypes.CREATE_SNAP_ERROR:
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
