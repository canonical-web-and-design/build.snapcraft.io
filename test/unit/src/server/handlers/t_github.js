import expect, { assert } from 'expect';
import nock from 'nock';

import {
  getDefaultBranch,
  getDefaultBranchCacheId
} from '../../../../../src/server/handlers/github';
import { conf } from '../../../../../src/server/helpers/config';
import {
  getMemcached,
  resetMemcached,
  setupInMemoryMemcached
} from '../../../../../src/server/helpers/memcached';

describe('GitHub handlers', function() {
  afterEach(function() {
    nock.cleanAll();
  });

  describe('getDefaultBranch', function() {
    let ghApi;

    beforeEach(function() {
      ghApi = nock(conf.get('GITHUB_API_ENDPOINT'));
      setupInMemoryMemcached();
    });

    afterEach(function() {
      ghApi.done();
      resetMemcached();
    });

    context('when result is in memcached', function() {
      const repositoryUrl = 'https://github.com/anowner/aname';

      beforeEach(function() {
        const cacheId = getDefaultBranchCacheId(repositoryUrl);
        getMemcached().cache[cacheId] = 'cached';
      });

      it('returns cached value', async function() {
        const branch = await getDefaultBranch(repositoryUrl);
        expect(branch).toBe('cached');
      });
    });

    context('when repository lookup fails', function() {
      beforeEach(function() {
        ghApi
          .get('/repos/anowner/aname')
          .reply(404, { message: 'Not Found' });
      });

      it('returns an error', async function() {
        try {
          const branch = await getDefaultBranch(
            'https://github.com/anowner/aname', 'secret');
          assert(
            false, 'Expected promise to be rejected; got %s instead', branch);
        } catch (error) {
          expect(error.status).toBe(404);
        }
      });
    });

    context('when repository lookup succeeds', function() {
      beforeEach(function() {
        ghApi
          .get('/repos/anowner/aname')
          .matchHeader('Authorization', 'token secret')
          .reply(200, { default_branch: 'dev' });
      });

      it('returns and caches default_branch from response', async function() {
        const repositoryUrl = 'https://github.com/anowner/aname';
        const branch = await getDefaultBranch(repositoryUrl, 'secret');
        expect(branch).toBe('dev');
        const cacheId = getDefaultBranchCacheId(repositoryUrl);
        expect(getMemcached().cache[cacheId]).toBe('dev');
      });
    });
  });
});
