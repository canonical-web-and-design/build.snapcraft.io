import * as ActionTypes from '../actions/repository-input';
import parseGitHubUrl from 'parse-github-url';

function parseRepository(input) {
  const gitHubRepo = parseGitHubUrl(input);
  return gitHubRepo ? gitHubRepo.repo : null;
}

export function repositoryInput(state = {
  isFetching: false,
  inputValue: '',
  repository: null,
  repositoryUrl: null,
  success: false,
  error: false
}, action) {
  switch(action.type) {
    case ActionTypes.SET_GITHUB_REPOSITORY:
      return {
        ...state,
        inputValue: action.payload,
        repository: parseRepository(action.payload),
        success: false,
        error: false
      };
    case ActionTypes.VERIFY_GITHUB_REPOSITORY:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.VERIFY_GITHUB_REPOSITORY_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        error: false,
        repositoryUrl: action.payload
      };
    case ActionTypes.VERIFY_GITHUB_REPOSITORY_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      };
    // XXX cjwatson 2016-12-21: Merge with
    // ActionTypes.VERIFY_GITHUB_REPOSITORY?
    case ActionTypes.CREATE_SNAP:
      return {
        ...state,
        isFetching: true
      };
    // XXX cjwatson 2016-12-21: Merge with
    // ActionTypes.VERIFY_GITHUB_REPOSITORY_ERROR?
    case ActionTypes.CREATE_SNAP_ERROR:
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
