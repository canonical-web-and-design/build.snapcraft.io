import 'isomorphic-fetch';

import conf from '../helpers/config';
import getGitHubRepoUrl from '../helpers/github-url';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_BUILDS = 'FETCH_BUILDS';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_ERROR = 'FETCH_BUILDS_ERROR';

export function fetchBuildsSuccess(builds) {
  return {
    type: FETCH_BUILDS_SUCCESS,
    payload: builds
  };
}

export function fetchBuildsError(error) {
  return {
    type: FETCH_BUILDS_ERROR,
    payload: error,
    error: true
  };
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    return response.json().then((json) => {
      // throw an error based on message from response body or status text
      const error = new Error(json.payload.message || response.statusText);
      error.status = response.status;
      error.response = response;
      throw error;
    });
  }
}

export function fetchSnap(repository) {
  return (dispatch) => {
    if (repository) {
      dispatch({
        type: FETCH_BUILDS
      });

      const repositoryUrl = encodeURIComponent(getGitHubRepoUrl(repository));
      const url = `${BASE_URL}/api/launchpad/snaps?repository_url=${repositoryUrl}`;
      return fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then((json) => dispatch(fetchBuilds(json.payload.message)))
        .catch((error) => dispatch(fetchBuildsError(error)));
    }
  };
}

export function fetchBuilds(snapLink) {
  return (dispatch) => {
    if (snapLink) {
      dispatch({
        type: FETCH_BUILDS
      });

      snapLink = encodeURIComponent(snapLink);
      const url = `${BASE_URL}/api/launchpad/builds?snap=${snapLink}`;
      return fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then((json) => dispatch(fetchBuildsSuccess(json.payload.builds)))
        .catch((error) => dispatch(fetchBuildsError(error)));
    }
  };
}
