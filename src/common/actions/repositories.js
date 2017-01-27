import 'isomorphic-fetch';

import conf from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_REPOSITORIES = 'FETCH_REPOSITORIES';
export const FETCH_REPOSITORIES_ERROR = 'FETCH_REPOSITORIES_ERROR';
export const SET_REPOSITORIES = 'SET_REPOSITORIES';

export function setRepositories(repos) {
  return {
    type: SET_REPOSITORIES,
    payload: repos
  };
}

// TODO bartaz: same as in other actions (share in some helper?)
export function getError(response, json) {
  const message = (json.payload && json.payload.message) || response.statusText;
  const error = new Error(message);
  error.response = response;
  error.json = json;
  return error;
}

// TODO bartaz: same as in other actions (share in some helper?)
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    return response.json().then((json) => {
      throw getError(response, json);
    });
  }
}

export function fetchUserRepositories() {
  return (dispatch) => {

    dispatch({
      type: FETCH_REPOSITORIES
    });

    return fetch(`${BASE_URL}/api/github/repos`, {
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
        });
      })
      .catch(error => dispatch(fetchRepositoriesError(error)));
  };
}

export function fetchRepositoriesError(error) {
  return {
    type: FETCH_REPOSITORIES_ERROR,
    payload: error,
    error: true
  };
}
