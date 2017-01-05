import 'isomorphic-fetch';

import conf from '../helpers/config';
import getGitHubRepoUrl from '../helpers/github-url';

const BASE_URL = conf.get('BASE_URL');

export const REQUEST_BUILDS = 'REQUEST_BUILDS';
export const REQUEST_BUILDS_SUCCESS = 'REQUEST_BUILDS_SUCCESS';
export const REQUEST_BUILDS_ERROR = 'REQUEST_BUILDS_ERROR';

const REQUEST_OPTIONS = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin'
};

export function requestBuildsSuccess(builds) {
  return {
    type: REQUEST_BUILDS_SUCCESS,
    payload: builds
  };
}

export function requestBuildsError(error) {
  return {
    type: REQUEST_BUILDS_ERROR,
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

export function requestBuilds(repository) {
  return (dispatch) => {
    if (repository) {
      dispatch({
        type: REQUEST_BUILDS
      });

      const repositoryUrl = getGitHubRepoUrl(repository);
      const url = `${BASE_URL}/api/launchpad/snaps/request-builds`;
      const settings = REQUEST_OPTIONS;
      settings.body = JSON.stringify({ repository_url: repositoryUrl });
      return fetch(url, settings)
        .then(checkStatus)
        .then((response) => response.json())
        .then((json) => dispatch(requestBuildsSuccess(json.payload.builds)))
        .catch((error) => dispatch(requestBuildsError(error)));
    }
  };
}
