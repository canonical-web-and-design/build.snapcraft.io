import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_SNAPS = 'FETCH_SNAP_REPOSITORIES';
export const FETCH_SNAPS_SUCCESS = 'FETCH_SNAPS_SUCCESS';
export const FETCH_SNAPS_ERROR = 'FETCH_SNAPS_ERROR';

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
