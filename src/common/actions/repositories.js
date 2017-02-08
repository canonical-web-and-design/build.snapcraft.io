import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_REPOSITORIES = 'FETCH_REPOSITORIES';
export const FETCH_REPOSITORIES_SUCCESS = 'FETCH_REPOSITORIES_SUCCESS';
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

    if (pageNumber) {
      urlParts.push('page/' + pageNumber);
    }

    dispatch({
      type: FETCH_REPOSITORIES
    });

    dispatch(setRepositories([]));

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
          dispatch(setRepositories(result.payload.repos));
          dispatch(fetchRepositoriesSuccess());

          if (result.pageLinks) {
            dispatch(setPageLinks(result.pageLinks));
          }
        });
      })
      .catch(error => dispatch(fetchRepositoriesError(error)));
  };
}

export function fetchRepositoriesSuccess() {
  return {
    type: FETCH_REPOSITORIES_SUCCESS
  };
}

export function fetchRepositoriesError(error) {
  return {
    type: FETCH_REPOSITORIES_ERROR,
    payload: error,
    error: true
  };
}

export function setPageLinks(pageLinks) {
  return {
    type: SET_REPOSITORY_PAGE_LINKS,
    payload: pageLinks
  };
}
