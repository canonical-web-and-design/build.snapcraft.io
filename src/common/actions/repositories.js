import { CALL_API } from '../middleware/call-api';
import { fetchUserSnaps } from './snaps.js';

export const REPOSITORIES_REQUEST = 'REPOSITORIES_REQUEST';
export const REPOSITORIES_SUCCESS = 'REPOSITORIES_SUCCESS';
export const REPOSITORIES_FAILURE = 'REPOSITORIES_FAILURE';
export const REPOSITORIES_DELAYED = 'REPOSITORIES_DELAYED';
export const REPOSITORIES_SEARCH = 'REPOSITORIES_SEARCH';

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
      dispatch(fetchChainedUserRepos()),
      dispatch(fetchUserSnaps(owner))
    ]);
  };
}

export function fetchChainedUserRepos(page) {
  return (dispatch) => {
    return dispatch(fetchUserRepositories(page))
      .then((result) => {
        // if result contains info about next page, trigger fetching next page of results
        if (result.pageLinks && result.pageLinks.next) {
          return dispatch(fetchChainedUserRepos(result.pageLinks.next));
        }
      });
  };
}

export function searchRepos(searchTerm) {
  return {
    type: REPOSITORIES_SEARCH,
    payload: searchTerm
  };
}
