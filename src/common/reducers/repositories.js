import union from 'lodash/union';

import * as ActionTypes from '../actions/repositories';

export function repositories(state = {
  isFetching: false,
  isDelayed: false,
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
        isDelayed: false,
        error: null,
        ids: union(state.ids, action.payload.response.result),
        pageLinks: action.payload.response.pageLinks
      };
    case ActionTypes.REPOSITORIES_FAILURE:
      return {
        ...state,
        isFetching: false,
        isDelayed: false,
        error: action.payload.error,
      };
    case ActionTypes.REPOSITORIES_DELAYED:
      return {
        ...state,
        isDelayed: true
      };
    default:
      return state;
  }
}
