import * as ActionTypes from '../actions/snaps';

import union from 'lodash/union';

export function snaps(state = {
  isFetching: false,
  success: false,
  error: null,
  ids: []
}, action) {
  switch(action.type) {
    case ActionTypes.FETCH_SNAPS:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.FETCH_SNAPS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        ids: union(state.ids, action.payload.response.result),
        error: null
      };
    case ActionTypes.FETCH_SNAPS_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload.error
      };
    case ActionTypes.REMOVE_SNAP:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.REMOVE_SNAP_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        ids: state.ids.filter((id) => {
          return id !== action.payload.repository_url;
        }),
        error: null
      };
    case ActionTypes.REMOVE_SNAP_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload.error
      };
    default:
      return state;
  }
}
