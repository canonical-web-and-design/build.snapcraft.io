import merge from 'lodash/merge';

import * as RepoActionTypes from '../../actions/repository';
import repository from './repository';

// TODO snaps

export function entities(state = {
  snaps: {},
  repos: {},
  owners: {}
}, action) {
  if (action.payload && action.payload.entities) {
    return merge({}, state, action.payload.entities);
  }

  // XXX
  // some action that don't use CALL_API middleware pass entities in payload directly
  // while CALL_API middleware does it in response prop
  if (action.payload && action.payload.response && action.payload.response.entities) {
    return merge({}, state, action.payload.response.entities);
  }

  // only modify repos if action is one of REPO_ types
  if (RepoActionTypes[action.type]) {
    return reduceRepoEntity(state, action);
  }

  return state;
}

function reduceRepoEntity(state, action) {
  return reduceEntityHelper(state, action, repository, 'repos');
}

function reduceEntityHelper(state, action, reducer, name) {
  const { payload } = action;

  if (payload && payload.id) {
    return {
      ...state,
      [name]: {
        ...state[name],
        [payload.id]: reducer(state[name][payload.id], action)
      }
    };
  } else {
    return state;
  }
}
