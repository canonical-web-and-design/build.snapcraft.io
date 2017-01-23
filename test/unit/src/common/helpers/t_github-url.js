import expect from 'expect';

import { getGitHubRepoUrl, parseGitHubRepoUrl } from '../../../../../src/common/helpers/github-url';

describe('getGitHubRepoUrl helper', () => {

  it('should return GH repo url when passed user/repo string', () => {
    expect(getGitHubRepoUrl('foo/bar')).toEqual('https://github.com/foo/bar');
  });

  it('should return GH repo url when passed user and repo strings', () => {
    expect(getGitHubRepoUrl('foo', 'bar')).toEqual('https://github.com/foo/bar');
  });

});

describe('parseGitHubRepoUrl helper', () => {

  it('should return repo data for valid url', () => {
    expect(parseGitHubRepoUrl('https://github.com/foo/bar')).toEqual({
      owner: 'foo',
      name: 'bar',
      fullName: 'foo/bar',
      url: 'https://github.com/foo/bar'
    });
  });

  it('should return repo data for valid owner/repo pair', () => {
    expect(parseGitHubRepoUrl('foo/bar')).toEqual({
      owner: 'foo',
      name: 'bar',
      fullName: 'foo/bar',
      url: 'https://github.com/foo/bar'
    });
  });

  it('should return null for null', () => {
    expect(parseGitHubRepoUrl(null)).toBe(null);
  });

  it('should return null for invalid GH url', () => {
    expect(parseGitHubRepoUrl('something foo bar')).toBe(null);
  });

});
