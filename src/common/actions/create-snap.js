import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';
import { parseGitHubRepoUrl } from '../helpers/github-url';

const BASE_URL = conf.get('BASE_URL');

export const SET_GITHUB_REPOSITORY = 'SET_GITHUB_REPOSITORY';
export const CREATE_SNAP = 'CREATE_SNAP';
export const CREATE_SNAP_ERROR = 'CREATE_SNAP_ERROR';

export function setGitHubRepository(value) {
  return {
    type: SET_GITHUB_REPOSITORY,
    payload: value
  };
}

export function createSnap(repositoryUrl, location) { // location for tests
  return (dispatch) => {
    if (repositoryUrl) {
      const { fullName } = parseGitHubRepoUrl(repositoryUrl);

      dispatch({
        type: CREATE_SNAP,
        payload: {
          id: fullName
        }
      });

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
              throw getError(response, result);
            }
            const startingUrl = `${BASE_URL}/${fullName}/setup`;
            (location || window.location).href =
              `${BASE_URL}/login/authenticate` +
              `?starting_url=${encodeURIComponent(startingUrl)}` +
              `&caveat_id=${encodeURIComponent(result.payload.message)}` +
              `&repository_url=${encodeURIComponent(repositoryUrl)}`;
          });
        })
        .catch(error => {
          // if LP error says there is already such snap, just redirect to builds page
          if (error.message === 'There is already a snap package with the same name and owner.') {
            (location || window.location).href = `${BASE_URL}/${fullName}/builds`;
          } else {
            dispatch(createSnapError(fullName, error));
          }
        });
    }
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
