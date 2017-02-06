import * as ActionTypes from '../actions/repositories';
import { parseGitHubRepoUrl } from '../helpers/github-url';

export function repositories(state = {
  isFetching: false,
  success: false,
  error: null,
  repos: null,
  pageLinks: {}
}, action) {
  switch(action.type) {
    case ActionTypes.FETCH_REPOSITORIES:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.SET_REPOSITORIES:
      return {
        ...state,
        repos: action.payload.map((repo) => {
          return {
            // parse repository info to keep consistent data format
            ...parseGitHubRepoUrl(repo.full_name),
            // but keep full repo data from API in the store too
            repo
          };
        })
      };
    case ActionTypes.FETCH_REPOSITORIES_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        error: null
      };
    case ActionTypes.FETCH_REPOSITORIES_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      };
    case ActionTypes.SET_REPOSITORY_PAGE_LINKS:
      return {
        ...state,
        pageLinks: action.payload
      };
    default:
      return state;
  }
}
