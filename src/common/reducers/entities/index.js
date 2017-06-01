import merge from 'lodash/merge';

import * as RepoActionTypes from '../../actions/repository';
import * as RegisterNameActionTypes from '../../actions/register-name';
import * as SnapsActionTypes from '../../actions/snaps';

import repository from './repository';
import snap from './snap';

import { getGitHubRepoUrl } from '../../helpers/github-url';

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

  // update snaps on register name actions
  if (RegisterNameActionTypes[action.type] || SnapsActionTypes[action.type]) {
    // TODO refactor
    // register name actions use fullName as id instead of repo url
    const snapAction = {
      ...action,
      payload: {
        ...action.payload,
        id: getGitHubRepoUrl(action.payload.id)
      }
    };

    return reduceSnapEntity(state, snapAction);
  }

  return state;
}

function reduceSnapEntity(state, action) {
  return reduceEntityHelper(state, action, snap, 'snaps');
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
