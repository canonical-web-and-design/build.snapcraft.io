import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';
import { fetchUserSnaps } from './snaps.js';

const BASE_URL = conf.get('BASE_URL');

export const REPOSITORIES_REQUEST = 'REPOSITORIES_REQUEST';
export const REPOSITORIES_SUCCESS = 'REPOSITORIES_SUCCESS';
export const REPOSITORIES_FAILURE = 'REPOSITORIES_FAILURE';


export function fetchRepositoriesSuccess(repos) {
  return {
    type: REPOSITORIES_SUCCESS,
    payload: repos
  };
}

export function fetchUserRepositories(pageNumber) {
  return async (dispatch) => {
    let urlParts = [BASE_URL, 'api/github/repos'];

    dispatch({
      type: REPOSITORIES_REQUEST
    });

    if (pageNumber) {
      urlParts.push('page/' + pageNumber);
    }

    try {
      const response = await fetch(urlParts.join('/'), {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });
      await checkStatus(response);
      const result = await response.json();
      if (result.status !== 'success') {
        throw getError(response, result);
      }

      dispatch(fetchRepositoriesSuccess(result.payload));
    } catch (error) {
      // TODO: Replace with logging helper
      console.warn(error); // eslint-disable-line no-console
      dispatch(fetchRepositoriesError(error));
    }
  };
}

export function fetchRepositoriesError(error) {
  return {
    type: REPOSITORIES_FAILURE,
    payload: error,
    error: true
  };
}

// XXX may need to split out the fetch from the success and failure dispatch
// to ensure than fetchRepositoriesSuccess happens in sync with refreshed user snaps
export function fetchUserRepositoriesAndSnaps(owner) {
  return (dispatch) => {
    return Promise.all([
      dispatch(fetchUserRepositories()),
      dispatch(fetchUserSnaps(owner))
    ]);
  };
}
