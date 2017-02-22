import 'isomorphic-fetch';

import { checkStatus } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const SET_GITHUB_REPOSITORY = 'SET_GITHUB_REPOSITORY';
export const CREATE_SNAPS_START = 'CREATE_SNAPS_START';
export const CREATE_SNAP = 'CREATE_SNAP';
export const CREATE_SNAP_SUCCESS = 'CREATE_SNAP_SUCCESS';
export const CREATE_SNAP_ERROR = 'CREATE_SNAP_ERROR';

export function setGitHubRepository(value) {
  return {
    type: SET_GITHUB_REPOSITORY,
    payload: value
  };
}

export function createSnap(repository) {
  return (dispatch) => {
    const repositoryUrl = repository.url;
    if (repositoryUrl) {
      const { fullName } = repository;

      dispatch({
        type: CREATE_SNAP,
        payload: { id: fullName }
      });

      return fetch(`${BASE_URL}/api/launchpad/snaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: repositoryUrl }),
        credentials: 'same-origin'
      })
        .then(checkStatus)
        .then(() => dispatch(createSnapSuccess(fullName)))
        .catch((error) => dispatch(createSnapError(fullName, error)));
    }
  };
}

export function createSnaps(repositories) {
  return (dispatch) => {
    // Clear out any previous batch-creation state.
    dispatch({ type: CREATE_SNAPS_START });
    const promises = repositories.map(
      (repository) => dispatch(createSnap(repository))
    );
    return Promise.all(promises);
  };
}

export function createSnapSuccess(id) {
  return {
    type: CREATE_SNAP_SUCCESS,
    payload: { id }
  };
}

export function createSnapError(id, error) {
  return {
    type: CREATE_SNAP_ERROR,
    payload: {
      id,
      error
    },
    error: true
  };
}
