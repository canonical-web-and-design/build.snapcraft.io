import { push } from 'react-router-redux';
import { checkStatus, getError } from '../helpers/api';

import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const REPO_TOGGLE_SELECT = 'REPO_TOGGLE_SELECT';

export function toggleRepositorySelection(id) {
  return {
    type: REPO_TOGGLE_SELECT,
    payload: {
      id
    }
  };
}

export const REPO_ADD = 'REPO_ADD';
export const REPO_SUCCESS = 'REPO_SUCCESS';
export const REPO_FAILURE = 'REPO_FAILURE';
export const REPO_RESET = 'REPO_RESET';

export function addRepos(repositories, owner) {
  return (dispatch) => {
    const promises = repositories.map(
      (repository) => {
        return dispatch(addRepo(repository));
      }
    );
    return Promise.all(promises).then(() => {
      if (owner) {
        dispatch(push(`/user/${owner}`));
      }
    });
  };
}

// add a repository to launchpad's build queue
export function addRepo(repository) {
  const { id, url, owner, name } = repository;

  return async (dispatch) => {
    dispatch({
      type: REPO_ADD,
      payload: {
        id
      }
    });

    try {
      await createWebhook(owner, name);

      // XXX
      // actual LP API call that we use on server side returns a snap representation
      // that we could use to immediatelly update client side state with newly
      // added snap
      const response = await fetch(`${BASE_URL}/api/launchpad/snaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: url }),
        credentials: 'same-origin'
      });

      await checkStatus(response);
      dispatch(addRepoSuccess(id));
    } catch (error) {
      dispatch(addRepoError(id, error));
      return Promise.reject(error);
    }
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

export async function createWebhook(owner, name) {
  const response = await fetch(`${BASE_URL}/api/github/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, name }),
    credentials: 'same-origin'
  });
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const json = await response.json();
    if (json.payload && json.payload.code === 'github-already-created') {
      return response;
    }
    throw getError(response, json);
  }
}

function addRepoSuccess(id) {
  return {
    type: REPO_SUCCESS,
    payload: {
      id
    }
  };
}

function addRepoError(id, error) {
  return {
    type: REPO_FAILURE,
    payload: {
      id,
      error
    },
    error: true
  };
}
