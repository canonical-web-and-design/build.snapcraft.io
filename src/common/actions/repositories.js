import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_REPOSITORIES = 'FETCH_ALL_REPOSITORIES';
export const FETCH_REPOSITORIES_ERROR = 'FETCH_REPOSITORIES_ERROR';
export const SET_REPOSITORIES = 'SET_REPOSITORIES';
export const SET_REPOSITORY_PAGE_LINKS = 'SET_REPOSITORY_PAGE_LINKS';

export function setRepositories(repos) {
  return {
    type: SET_REPOSITORIES,
    payload: repos
  };
}

export function fetchUserRepositories(pageNumber) {
  return (dispatch) => {
    let urlParts = [BASE_URL, 'api/github/repos'];

    dispatch({
      type: FETCH_REPOSITORIES
    });

    if (pageNumber) {
      urlParts.push('page/' + pageNumber);
    }

    return fetch(urlParts.join('/'), {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    })
      .then(checkStatus)
      .then(response => {
        return response.json().then(result => {
          if (result.status !== 'success') {
            throw getError(response, result);
          }
          dispatch(setRepositories({
            repos: result.payload.repos,
            links: result.pageLinks
          }));
        })
        .catch(error => {
          return Promise.reject(error);
        });
      })
      .catch(error => {
        // TODO: Replace with logging helper
        console.warn(error); // eslint-disable-line no-console
        dispatch(fetchRepositoriesError(error));
      });
  };
}

export function fetchRepositoriesError(error) {
  return {
    type: FETCH_REPOSITORIES_ERROR,
    payload: error,
    error: true
  };
}
