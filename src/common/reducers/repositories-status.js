import * as ActionTypes from '../actions/create-snap';

export function repositoriesStatus(state = {}, action) {
  const { payload } = action;

  const initialStatus = {
    isFetching: false,
    error: null
  };

  switch(action.type) {
    case ActionTypes.CREATE_SNAP:
      return {
        ...state,
        [payload.id]: {
          ...initialStatus,
          ...state[payload.id],
          isFetching: true
        }
      };
    case ActionTypes.CREATE_SNAP_ERROR:
      return {
        ...state,
        [payload.id]: {
          ... state[payload.id],
          isFetching: false,
          success: false,
          error: payload.error
        }
      };
    default:
      return state;
  }
}
