import 'isomorphic-fetch';

export const SET_GITHUB_REPOSITORY = 'SET_GITHUB_REPOSITORY';

export function setGitHubRepository(value) {
  return {
    type: SET_GITHUB_REPOSITORY,
    payload: value
  };
}
