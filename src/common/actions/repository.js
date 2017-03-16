import { push } from 'react-router-redux';
import { checkStatus, getError } from '../helpers/api';

import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const REPOSITORY_TOGGLE_SELECT = 'REPOSITORY_TOGGLE_SELECT';

export function toggleRepositorySelection(id) {
  return {
    type: REPOSITORY_TOGGLE_SELECT,
    payload: {
      id
    }
  };
}

export const REPOSITORY_BUILD = 'REPOSITORY_BUILD';
export const REPOSITORY_SUCCESS = 'REPOSITORY_SUCCESS';
export const REPOSITORY_FAILURE = 'REPOSITORY_FAILURE';
export const REPOSITORY_RESET = 'REPOSITORY_RESET';

export function buildRepositories(repositories) {
  return (dispatch) => {
    const promises = repositories.map(
      (repository) => {
        return dispatch(buildRepository(repository));
      }
    );
    return Promise.all(promises).then(() => dispatch(push('/dashboard')));
  };
}

export function buildRepository(repository) {
  const { id, url, owner, name } = repository;

  return async (dispatch) => {
    dispatch({
      type: REPOSITORY_BUILD,
      payload: {
        id
      }
    });

    try {
      await createWebhook(owner, name);
      const response = await fetch(`${BASE_URL}/api/launchpad/snaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: url }),
        credentials: 'same-origin'
      });

      await checkStatus(response);
      dispatch(buildRepositorySuccess(id));
    } catch (error) {
      dispatch(buildRepositoryError(id, error));
      return Promise.reject(error);
    }
  };
}

export function resetRepository(id) {
  return {
    type: REPOSITORY_RESET,
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

function buildRepositorySuccess(id) {
  return {
    type: REPOSITORY_SUCCESS,
    payload: {
      id
    }
  };
}

function buildRepositoryError(id, error) {
  return {
    type: REPOSITORY_FAILURE,
    payload: {
      id,
      error
    },
    error: true
  };
}
