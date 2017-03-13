import 'isomorphic-fetch';

import { checkStatus } from '../helpers/api';
import { conf } from '../helpers/config';

import { parseGitHubRepoUrl } from '../helpers/github-url';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_BUILDS = 'FETCH_BUILDS';
export const FETCH_SNAP_SUCCESS = 'FETCH_SNAP_SUCCESS';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_ERROR = 'FETCH_BUILDS_ERROR';

const REQUEST_POST_OPTIONS = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin'
};

export function fetchBuildsSuccess(id, builds) {
  return {
    type: FETCH_BUILDS_SUCCESS,
    payload: {
      id,
      builds
    }
  };
}

export function fetchBuildsError(id, error) {
  return {
    type: FETCH_BUILDS_ERROR,
    payload: {
      id,
      error
    },
    error: true
  };
}

// Fetch snap info (self_link) for given repository
export function fetchSnap(repositoryUrl) {
  const { fullName } = parseGitHubRepoUrl(repositoryUrl);

  return async (dispatch) => {
    if (repositoryUrl) {
      dispatch({
        type: FETCH_BUILDS,
        payload: {
          id: fullName
        }
      });

      repositoryUrl = encodeURIComponent(repositoryUrl);
      const url = `${BASE_URL}/api/launchpad/snaps?repository_url=${repositoryUrl}`;
      try {
        const response = await checkStatus(await fetch(url));
        const json = await response.json();
        const snap = json.payload.snap;
        dispatch({
          type: FETCH_SNAP_SUCCESS,
          payload: {
            id: fullName,
            snap
          }
        });
      } catch (error) {
        dispatch(fetchBuildsError(fullName, error));
      }
    }
  };
}

// Fetch builds list for given snap
export function fetchBuilds(repositoryUrl, snapLink) {
  const { fullName } = parseGitHubRepoUrl(repositoryUrl);

  return async (dispatch) => {
    if (snapLink) {
      dispatch({
        type: FETCH_BUILDS,
        payload: {
          id: fullName
        }
      });

      snapLink = encodeURIComponent(snapLink);
      const url = `${BASE_URL}/api/launchpad/builds?snap=${snapLink}`;
      try {
        const response = await checkStatus(await fetch(url));
        const json = await response.json();
        dispatch(fetchBuildsSuccess(fullName, json.payload.builds));
      } catch (error) {
        dispatch(fetchBuildsError(fullName, error));
      }
    }
  };
}

// Reguest new builds for given repository
export function requestBuilds(repositoryUrl) {
  const { fullName } = parseGitHubRepoUrl(repositoryUrl);

  return async (dispatch) => {
    if (repositoryUrl) {
      dispatch({
        type: FETCH_BUILDS,
        payload: {
          id: fullName
        }
      });

      const url = `${BASE_URL}/api/launchpad/snaps/request-builds`;
      const settings = {
        ...REQUEST_POST_OPTIONS,
        body: JSON.stringify({ repository_url: repositoryUrl })
      };

      try {
        const response = await checkStatus(await fetch(url, settings));
        const json = await response.json();
        dispatch(fetchBuildsSuccess(fullName, json.payload.builds));
      } catch (error) {
        dispatch(fetchBuildsError(fullName, error));
      }
    }
  };
}
