import expect from 'expect';

import getGitHubRepoUrl from '../../../../../src/common/helpers/github-url';

describe('getGitHubRepoUrl helper', () => {

  it('should return GH repo url when passed user/repo string', () => {
    expect(getGitHubRepoUrl('foo/bar')).toEqual('https://github.com/foo/bar');
  });

  it('should return GH repo url when passed user and repo strings', () => {
    expect(getGitHubRepoUrl('foo', 'bar')).toEqual('https://github.com/foo/bar');
  });

});
