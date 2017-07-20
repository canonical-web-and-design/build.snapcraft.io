import expect from 'expect';
import nock from 'nock';

import { getGitBranch } from '../../../../../src/server/handlers/launchpad';
import { conf } from '../../../../../src/server/helpers/config';
import {
  resetMemcached,
  setupInMemoryMemcached
} from '../../../../../src/server/helpers/memcached';

describe('Launchpad handlers', function() {
  afterEach(function() {
    nock.cleanAll();
  });

  describe('getGitBranch', function() {
    let ghApi;

    beforeEach(function() {
      ghApi = nock(conf.get('GITHUB_API_ENDPOINT'));
      setupInMemoryMemcached();
    });

    afterEach(function() {
      ghApi.done();
      resetMemcached();
    });

    context('when git_path is HEAD', function() {
      beforeEach(function() {
        ghApi
          .get('/repos/anowner/aname')
          .matchHeader('Authorization', 'token secret')
          .reply(200, { default_branch: 'dev' });
      });

      it('gets the default branch name from GitHub', async function() {
        const snap = {
          git_repository_url: 'https://github.com/anowner/aname',
          git_path: 'HEAD'
        };
        const branch = await getGitBranch(snap, 'secret');
        expect(branch).toBe('dev');
      });
    });

    context('when git_path is a full reference path', function() {
      it('returns path with initial refs/heads/ removed', async function() {
        const snap = {
          git_repository_url: 'https://github.com/anowner/aname',
          git_path: 'refs/heads/master'
        };
        const branch = await getGitBranch(snap);
        expect(branch).toBe('master');
      });
    });
  });
});
