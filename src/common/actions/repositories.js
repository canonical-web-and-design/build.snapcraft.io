import { CALL_API } from '../middleware/call-api';
import { fetchUserSnaps } from './snaps.js';

export const REPOSITORIES_REQUEST = 'REPOSITORIES_REQUEST';
export const REPOSITORIES_SUCCESS = 'REPOSITORIES_SUCCESS';
export const REPOSITORIES_FAILURE = 'REPOSITORIES_FAILURE';
export const REPOSITORIES_DELAYED = 'REPOSITORIES_DELAYED';

export function fetchUserRepositories(pageNumber) {
  let path = '/api/github/repos';

  if (pageNumber) {
    path += ('?page=' + pageNumber);
  }

  return {
    [CALL_API]: {
      types: [REPOSITORIES_REQUEST, REPOSITORIES_SUCCESS, REPOSITORIES_FAILURE, REPOSITORIES_DELAYED],
      path: path,
      options: {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      }
    }
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
