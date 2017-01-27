import * as ActionTypes from '../actions/repositories';
import { parseGitHubRepoUrl } from '../helpers/github-url';

export function repositories(state = {
  isFetching: false,
  success: false,
  error: null,
  repos: null
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
        isFetching: false,
        success: true,
        error: null,
        repos: action.payload.map((repo) => {
          return {
            // parse repository info to keep consistent data format
            ...parseGitHubRepoUrl(repo.full_name),
            // but keep full repo data from API in the store too
            repo
          };
        })
      };
    case ActionTypes.FETCH_REPOSITORIES_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      };
    default:
      return state;
  }
}
