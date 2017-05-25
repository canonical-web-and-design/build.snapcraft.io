import { push } from 'react-router-redux';

import { APICompatibleError } from '../helpers/api';
import { CALL_API } from '../middleware/call-api';
import { fetchUserSnaps } from './snaps.js';

export const REPO_TOGGLE_SELECT = 'REPO_TOGGLE_SELECT';

export function toggleRepositorySelection(id) {
  return {
    type: REPO_TOGGLE_SELECT,
    payload: {
      id
    }
  };
}

export const REPO_ADD_REQUEST = 'REPO_ADD_REQUEST';
export const REPO_ADD_SUCCESS = 'REPO_ADD_SUCCESS';
export const REPO_ADD_FAILURE = 'REPO_ADD_FAILURE';
export const REPO_RESET = 'REPO_RESET';

export function addRepos(repos, owner) {
  return async (dispatch) => {
    try {
      await Promise.all(repos.map(async (repo) => {
        await dispatch(createWebhook(repo));
        return dispatch(addRepo(repo));
      }));

      // XXX
      // Wait for updated snaps list (so we don't show My repos until we
      // updated the list with newly added repos).
      //
      // This is a temporary fix before we implement #666
      await dispatch(fetchUserSnaps(owner));

      if (owner) {
        dispatch(push(`/user/${owner}`));
      }
    } catch(error) {
      dispatch(addRepoError(error.action.id, error));
    }
  };
}

function addRepo(repository) {
  const { id, url } = repository;

  return {
    payload: { id },
    [CALL_API]: {
      path: '/api/launchpad/snaps',
      types: [REPO_ADD_REQUEST, REPO_ADD_SUCCESS],
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: url }),
        credentials: 'same-origin'
      }
    }
  };
}

function addRepoError(id, error) {
  return {
    type: REPO_ADD_FAILURE,
    payload: {
      id,
      error: new APICompatibleError({
        code: error.json.body.code,
        message: 'Repo cannot be added at this time',
        detail: `Failed to add repo: ${error}`
      })
    },
    error: true
  };
}

export function resetRepository(id) {
  return {
    type: REPO_RESET,
    payload: {
      id
    }
  };
}

function createWebhook({ owner, name, id }) {
  return {
    payload: { id },
    [CALL_API]: {
      path: '/api/github/webhook',
      types: [REPO_ADD_REQUEST, REPO_ADD_SUCCESS],
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, name }),
        credentials: 'same-origin'
      }
    }
  };
}
