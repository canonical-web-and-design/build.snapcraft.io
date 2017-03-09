import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_SNAPS = 'FETCH_SNAP_REPOSITORIES';
export const FETCH_SNAPS_SUCCESS = 'FETCH_SNAPS_SUCCESS';
export const FETCH_SNAPS_ERROR = 'FETCH_SNAPS_ERROR';
export const REMOVE_SNAP = 'REMOVE_SNAP';
export const REMOVE_SNAP_SUCCESS = 'REMOVE_SNAP_SUCCESS';
export const REMOVE_SNAP_ERROR = 'REMOVE_SNAP_ERROR';

export function fetchUserSnaps(owner) {
  return (dispatch) => {
    const url = `${BASE_URL}/api/launchpad/snaps/list`;
    const query = `owner=${encodeURIComponent(owner)}`;

    dispatch({
      type: FETCH_SNAPS
    });

    return fetch(`${url}?${query}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    })
      .then(checkStatus)
      .then(response => {
        return response.json().then(result => {
          if (result.status !== 'success') {
            throw getError(response, result);
          }

          dispatch(fetchSnapsSuccess(result.payload.snaps));
        })
        .catch(error => {
          return Promise.reject(error);
        });
      })
      .catch(error => dispatch(fetchSnapsError(error)));
  };
}

export function fetchSnapsSuccess(snaps) {
  return {
    type: FETCH_SNAPS_SUCCESS,
    payload: snaps
  };
}

export function fetchSnapsError(error) {
  return {
    type: FETCH_SNAPS_ERROR,
    payload: error,
    error: true
  };
}

export function removeSnap(repositoryUrl) {
  return (dispatch) => {
    dispatch({
      type: REMOVE_SNAP,
      payload: { repository_url: repositoryUrl }
    });

    return fetch(`${BASE_URL}/api/launchpad/snaps/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repository_url: repositoryUrl }),
      credentials: 'same-origin'
    })
      .then(checkStatus)
      .then((response) => {
        return response.json().then((result) => {
          if (result.status !== 'success') {
            throw getError(response, result);
          }

          dispatch(removeSnapSuccess(repositoryUrl));
        });
      })
      .catch((error) => dispatch(removeSnapError(repositoryUrl, error)));
  };
}

export function removeSnapSuccess(repositoryUrl) {
  return {
    type: REMOVE_SNAP_SUCCESS,
    payload: { repository_url: repositoryUrl }
  };
}

export function removeSnapError(repositoryUrl, error) {
  return {
    type: REMOVE_SNAP_ERROR,
    payload: {
      repository_url: repositoryUrl,
      error
    },
    error: true
  };
}
