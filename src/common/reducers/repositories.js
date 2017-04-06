import union from 'lodash/union';

import * as ActionTypes from '../actions/repositories';

export function repositories(state = {
  isFetching: false,
  error: null,
  ids: [],
  pageLinks: {}
}, action) {

  switch(action.type) {
    case ActionTypes.REPOSITORIES_REQUEST:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.REPOSITORIES_SUCCESS:
      return {
        ...state,
        isFetching: false,
        error: null,
        ids: union(state.ids, action.payload.result),
        pageLinks: action.payload.pageLinks
      };
    case ActionTypes.REPOSITORIES_FAILURE:
      return {
        ...state,
        isFetching: false,
        error: action.payload,
      };
    default:
      return state;
  }
}
