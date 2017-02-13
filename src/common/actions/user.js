import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const FETCH_USER = 'FETCH_USER';
export const SET_USER = 'SET_USER';
export const FETCH_USER_ERROR = 'FETCH_USER_ERROR';

export function setUser(user) {
  return {
    type: SET_USER,
    payload: user
  };
}

export function fetchUserError(error) {
  return {
    type: FETCH_USER_ERROR,
    payload: error,
    error: true
  };
}

export function fetchUser() {
  return (dispatch) => {
    dispatch({ type: FETCH_USER });

    return fetch(`${BASE_URL}/api/github/user`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    })
      .then(checkStatus)
      .then((response) => {
        return response.json().then(result => {
          if (result.status !== 'success') {
            throw getError(response, result);
          }
          dispatch(setUser(result.payload.user));
        });
      })
      .catch((error) => dispatch(fetchUserError(error)));
  };
}
