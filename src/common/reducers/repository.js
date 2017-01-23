import * as ActionTypes from '../actions/repository-input';
import { parseGitHubRepoUrl } from '../helpers/github-url';

export function repository(state = null, action) {
  switch(action.type) {
    case ActionTypes.SET_GITHUB_REPOSITORY:
      return parseGitHubRepoUrl(action.payload);
    default:
      return state;
  }
}
