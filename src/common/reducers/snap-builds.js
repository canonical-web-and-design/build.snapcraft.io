import * as ActionTypes from '../actions/snap-builds';
import { snapBuildFromAPI } from '../helpers/snap-builds';

export const snapBuildsInitialStatus = {
  isFetching: false,
  snap: null,
  builds: [],
  success: false,
  error: null
};

export function snapBuilds(state = {}, action) {
  const { payload } = action;

  const initialStatus = snapBuildsInitialStatus;

  switch(action.type) {
    case ActionTypes.FETCH_BUILDS:
      return {
        ...state,
        [payload.id]: {
          ...initialStatus,
          ...state[payload.id],
          isFetching: true
        }
      };
    case ActionTypes.FETCH_SNAP_SUCCESS:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          isFetching: false,
          snap: payload.snap
        }
      };
    case ActionTypes.FETCH_BUILDS_SUCCESS:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          isFetching: false,
          success: true,
          builds: payload.builds.map(snapBuildFromAPI),
          error: null
        }
      };
    case ActionTypes.FETCH_BUILDS_ERROR:
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
