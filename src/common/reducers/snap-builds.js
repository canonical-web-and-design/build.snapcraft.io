import * as ActionTypes from '../actions/snap-builds';
import {
  annotateSnapBuild,
  snapBuildFromAPI
} from '../helpers/snap-builds';

export const getAnnotatedBuilds = (action) => {
  const payload = action.payload.response.payload;
  return payload.builds.map(snapBuildFromAPI).map(annotateSnapBuild(
    payload.build_annotations, payload.build_request_annotations
  ));
};

export const snapBuildsInitialStatus = {
  isFetching: false,
  snap: null,
  builds: [],
  success: false,
  error: null
};

export function snapBuilds(state = {}, action) {
  const initialStatus = snapBuildsInitialStatus;

  switch(action.type) {
    case ActionTypes.FETCH_BUILDS:
      return {
        ...state,
        [action.payload.id]: {
          ...initialStatus,
          ...state[action.payload.id],
          isFetching: true
        }
      };
    case ActionTypes.FETCH_SNAP_SUCCESS:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          isFetching: false
        }
      };
    case ActionTypes.FETCH_BUILDS_SUCCESS:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          isFetching: false,
          success: true,
          builds: getAnnotatedBuilds(action),
          error: null
        }
      };
    case ActionTypes.REQUEST_BUILDS_SUCCESS:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          isFetching: false,
          success: true,
          builds: getAnnotatedBuilds(action).concat(
            state[action.payload.id].builds
          ),
          error: null
        }
      };
    case ActionTypes.FETCH_BUILDS_ERROR:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          isFetching: false,
          success: false,
          error: action.payload.error
        }
      };
    default:
      return state;
  }
}
