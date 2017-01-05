import * as ActionTypes from '../actions/request-snap-builds';
import { snapBuildFromAPI } from '../helpers/snap-builds';

export function requestSnapBuilds(state = {
  isFetching: false,
  builds: [],
  success: false,
  error: null
}, action) {
  switch(action.type) {
    case ActionTypes.REQUEST_BUILDS:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.REQUEST_BUILDS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        builds: action.payload.map(snapBuildFromAPI),
        error: null
      };
    case ActionTypes.REQUEST_BUILDS_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      };
    default:
      return state;
  }
}
