import 'isomorphic-fetch';

import conf from '../helpers/config';
import getGitHubRepoUrl from '../helpers/github-url';

const BASE_URL = conf.get('BASE_URL');
const GITHUB_API_ENDPOINT = conf.get('GITHUB_API_ENDPOINT');

export const SET_GITHUB_REPOSITORY = 'SET_GITHUB_REPOSITORY';
export const VERIFY_GITHUB_REPOSITORY = 'VERIFY_GITHUB_REPOSITORY';
export const VERIFY_GITHUB_REPOSITORY_SUCCESS = 'VERIFY_GITHUB_REPOSITORY_SUCCESS';
export const VERIFY_GITHUB_REPOSITORY_ERROR = 'VERIFY_GITHUB_REPOSITORY_ERROR';
export const CREATE_SNAP = 'CREATE_SNAP';
export const CREATE_SNAP_ERROR = 'CREATE_SNAP_ERROR';

export function setGitHubRepository(value) {
  return {
    type: SET_GITHUB_REPOSITORY,
    payload: value
  };
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

export function verifyGitHubRepository(repository) {
  return (dispatch) => {
    if (repository) {
      dispatch({
        type: VERIFY_GITHUB_REPOSITORY,
        payload: repository
      });

      return fetch(`${GITHUB_API_ENDPOINT}/repos/${repository}/contents/snapcraft.yaml`)
        .then(checkStatus)
        .then(() => dispatch(verifyGitHubRepositorySuccess(getGitHubRepoUrl(repository))))
        .catch(error => dispatch(verifyGitHubRepositoryError(error)));
    }
  };
}

export function verifyGitHubRepositorySuccess(repositoryUrl) {
  return {
    type: VERIFY_GITHUB_REPOSITORY_SUCCESS,
    payload: repositoryUrl
  };
}

export function verifyGitHubRepositoryError(error) {
  return {
    type: VERIFY_GITHUB_REPOSITORY_ERROR,
    payload: error,
    error: true
  };
}

export function createSnap(repository, location) {
  return (dispatch) => {
    if (repository) {
      dispatch({
        type: CREATE_SNAP,
        payload: repository
      });
      const repositoryUrl = getGitHubRepoUrl(repository);

      return fetch(`${BASE_URL}/api/launchpad/snaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: repositoryUrl }),
        credentials: 'same-origin'
      })
        .then(checkStatus)
        .then(response => {
          return response.json().then(result => {
            if (result.status !== 'success' ||
                result.payload.code !== 'snap-created') {
              const error = new Error(response.statusText);
              error.response = response;
              throw error;
            }
            const startingUrl = `${BASE_URL}/${repository}/builds`;
            (location || window.location).href =
              `${BASE_URL}/login/authenticate` +
              `?starting_url=${encodeURIComponent(startingUrl)}` +
              `&caveat_id=${encodeURIComponent(result.payload.message)}` +
              `&repository_url=${encodeURIComponent(repositoryUrl)}`;
          });
        })
        .catch(error => dispatch(createSnapError(error)));
    }
  };
}

export function createSnapError(error) {
  return {
    type: CREATE_SNAP_ERROR,
    payload: error,
    error: true
  };
}
