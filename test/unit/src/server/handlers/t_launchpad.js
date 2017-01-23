import expect from 'expect';
import nock from 'nock';

import { completeSnapAuthorization } from '../../../../../src/server/handlers/launchpad';
import { conf } from '../../../../../src/server/helpers/config.js';

describe('completeSnapAuthorization', () => {
  const session = { 'token': 'secret' };

  context('when snap exists', () => {
    let completeAuthorizationScope;

    beforeEach(() => {
      nock(conf.get('GITHUB_API_ENDPOINT'))
        .get('/repos/anowner/aname')
        .reply(200, { permissions: { admin: true } });
      const lp_api_url = conf.get('LP_API_URL');
      const lp_api_base = `${lp_api_url}/devel`;
      nock(lp_api_url)
        .get('/devel/+snaps')
        .query({
          'ws.op': 'findByURL',
          url: 'https://github.com/anowner/aname'
        })
        .reply(200, {
          total_size: 1,
          start: 0,
          entries: [
            {
              resource_type_link: `${lp_api_base}/#snap`,
              self_link: `${lp_api_base}/~test-user/+snap/test-snap`,
              owner_link: `${lp_api_base}/~test-user`
            }
          ]
        });
      completeAuthorizationScope = nock(lp_api_url)
        .post('/devel/~test-user/+snap/test-snap', {
          'ws.op': 'completeAuthorization',
          'discharge_macaroon': 'dummy-discharge'
        })
        .reply(200, 'null', {
          'Content-Type': 'application/json'
        });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('completes the authorization', () => {
      return completeSnapAuthorization(
          session, 'https://github.com/anowner/aname', 'dummy-discharge')
        .then(() => completeAuthorizationScope.done());
    });
  });

  context('when snap does not exist', () => {
    beforeEach(() => {
      nock(conf.get('GITHUB_API_ENDPOINT'))
        .get('/repos/anowner/aname')
        .reply(200, { permissions: { admin: true } });
      const lp_api_url = conf.get('LP_API_URL');
      nock(lp_api_url)
        .get('/devel/+snaps')
        .query({
          'ws.op': 'findByURL',
          url: 'https://github.com/anowner/aname'
        })
        .reply(200, {
          total_size: 0,
          start: 0,
          entries: []
        });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('returns a "snap-not-found" error', () => {
      return completeSnapAuthorization(
          session, 'https://github.com/anowner/aname', 'dummy-discharge')
        .then(() => expect('unexpected success').toNotExist())
        .catch((error) => expect(error).toMatch({
          status: 404,
          body: { payload: { code: 'snap-not-found' } }
        }));
    });
  });

  context('when user has no admin permissions on GitHub repository', () => {
    beforeEach(() => {
      nock(conf.get('GITHUB_API_ENDPOINT'))
        .get('/repos/anowner/aname')
        .reply(200, { permissions: { admin: false } });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('returns a "github-no-admin-permissions" error', () => {
      return completeSnapAuthorization(
          session, 'https://github.com/anowner/aname', 'dummy-discharge')
        .then(() => expect('unexpected success').toNotExist())
        .catch((error) => expect(error).toMatch({
          status: 401,
          body: { payload: { code: 'github-no-admin-permissions' } }
        }));
    });
  });
});
