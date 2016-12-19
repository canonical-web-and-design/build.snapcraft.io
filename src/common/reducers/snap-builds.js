import * as ActionTypes from '../actions/snap-builds';
import { snapBuildFromAPI } from '../helpers/snap-builds';

export function snapBuilds(state = {
  isFetching: false,
  builds: [],
  error: false
}, action) {
  switch(action.type) {
    case ActionTypes.FETCH_BUILDS:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.FETCH_BUILDS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        builds: action.payload.map(snapBuildFromAPI),
        error: false
      };
    case ActionTypes.FETCH_BUILDS_ERROR:
      return {
        ...state,
        isFetching: false,
        error: action.payload
      };
    default:
      return state;
  }
}
