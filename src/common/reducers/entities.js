import merge from 'lodash/merge';

import * as ActionTypes from '../actions/repository';

// export only for testing
export function repository(state={
  __isSelected: false,
  __isFetching: false,
  __error: null
}, action) {

  switch(action.type) {
    case ActionTypes.REPOSITORY_TOGGLE_SELECT: {
      const wasSelected = state.__isSelected;

      return {
        ...state,
        __isSelected: !wasSelected
      };
    }
    case ActionTypes.REPOSITORY_BUILD: {
      return {
        ...state,
        __isFetching: true,
        __isSelected: true
      };
    }
    case ActionTypes.REPOSITORY_SUCCESS:
    case ActionTypes.REPOSITORY_RESET: {
      return {
        ...state,
        __isSelected: false,
        __isFetching: false,
        __error: null
      };
    }
    case ActionTypes.REPOSITORY_FAILURE: {
      return {
        ...state,
        __error: action.payload.error.json
      };
    }
    default:
      return state;
  }
}

// TODO snaps

export function entities(state = { snaps: {}, repos: {} }, action) {
  if (action.payload && action.payload.entities) {
    return merge({}, state, action.payload.entities);
  }

  if (ActionTypes[action.type]) {
    return {
      ...state,
      repos: {
        ...state.repos,
        [action.payload.id]: repository(state.repos[action.payload.id], action)
      }
    };
  }

  return state;
}
