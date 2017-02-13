import expect from 'expect';
import nock from 'nock';
import path from 'path';

import { requireWithMockConfigHelper } from '../../../../helpers';
import constants from '../../../../../src/server/constants';

const UBUNTU_SSO_URL = 'https://login.ubuntu.com';
const OPENID_VERIFY_URL = 'http://localhost:8000/login/verify';
const OPENID_TEAMS = ['team-name'];
const GITHUB_API_ENDPOINT = 'http://localhost:4000/github';
const LP_API_URL = 'http://localhost:4000/launchpad';
const requireWithMockConfig = requireWithMockConfigHelper.bind(
  null,
  path.resolve(__dirname, '../../../../../src/server/handlers/login'),
  '../helpers/config'
);

describe('processVerifiedAssertion', () => {
  const res = {
    redirect: function(url) {
      this.redirectedUrl = url;
    }
  };

  let processedError;

  const next = function(error) {
    processedError = error;
  };

  beforeEach(() => {
    res.redirectedUrl = null;
    processedError = null;
  });

  context('when OPENID_TEAMS are configured', () => {
    let processVerifiedAssertion;

    beforeEach(() => {
      ({ processVerifiedAssertion } = requireWithMockConfig({
        UBUNTU_SSO_URL,
        OPENID_VERIFY_URL,
        OPENID_TEAMS,
        GITHUB_API_ENDPOINT
      }));
    });

    it('produces E_UNAUTHORIZED error if not in any of required teams', () => {
      const req = { session: {} };
      const result = { authenticated: true, teams: [] };
      processVerifiedAssertion(req, res, next, null, result);
      expect(processedError.message).toBe(constants.E_UNAUTHORIZED);
    });

    it('redirects if in some of required teams', () => {
      const req = { session: {}, query: {} };
      const result = { authenticated: true, teams: ['team-name'] };
      return processVerifiedAssertion(req, res, next, null, result)
        .then(() => expect(res.redirectedUrl).toBe('/'));
    });
  });

  context('when no OPENID_TEAMS are configured', () => {
    let processVerifiedAssertion;

    beforeEach(() => {
      ({ processVerifiedAssertion } = requireWithMockConfig({
        UBUNTU_SSO_URL,
        OPENID_VERIFY_URL,
        GITHUB_API_ENDPOINT
      }));
    });

    it('passes through verification errors', () => {
      const error = new Error('test');
      processVerifiedAssertion({}, res, next, error);
      expect(processedError).toBe(error);
    });

    it('produces E_SSO_FAIL error if not authenticated', () => {
      processVerifiedAssertion({}, res, next, null, { 'authenticated': false });
      expect(processedError.message).toBe(constants.E_SSO_FAIL);
    });

    it('produces E_NO_SESSION error if the request has no session', () => {
      processVerifiedAssertion({}, res, next, null, { 'authenticated': true });
      expect(processedError.message).toBe(constants.E_NO_SESSION);
    });

    it('redirects to / if starting_url is not given', () => {
      const req = { session: {}, query: {} };
      const result = { authenticated: true };
      return processVerifiedAssertion(req, res, next, null, result)
        .then(() => expect(res.redirectedUrl).toBe('/'));
    });

    it('redirects to starting_url if given', () => {
      const req = { session: {}, query: { starting_url: '/success' } };
      const result = { authenticated: true };
      return processVerifiedAssertion(req, res, next, null, result)
        .then(() => expect(res.redirectedUrl).toBe('/success'));
    });

    context('with discharge macaroon', () => {
      const session = { token: 'secret' };

      context('for a single snap', () => {
        context('when snap exists', () => {
          let completeAuthorizationScope;

          beforeEach(() => {
            nock(GITHUB_API_ENDPOINT)
              .get('/repos/anowner/aname')
              .reply(200, { permissions: { admin: true } });
            const lp_api_base = `${LP_API_URL}/devel`;
            nock(LP_API_URL)
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
            completeAuthorizationScope = nock(LP_API_URL)
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
            const req = {
              session,
              query: { repository_url: 'https://github.com/anowner/aname' }
            };
            const result = {
              authenticated: true,
              discharge: 'dummy-discharge'
            };
            return processVerifiedAssertion(req, res, next, null, result)
              .then(() => completeAuthorizationScope.done());
          });

          it('redirects', () => {
            const req = {
              session,
              query: { repository_url: 'https://github.com/anowner/aname' }
            };
            const result = {
              authenticated: true,
              discharge: 'dummy-discharge'
            };
            return processVerifiedAssertion(req, res, next, null, result)
              .then(() => expect(res.redirectedUrl).toBe('/'));
          });
        });

        context('when completing authorization throws an error', () => {
          beforeEach(() => {
            nock(GITHUB_API_ENDPOINT)
              .get('/repos/anowner/aname')
              .reply(200, { permissions: { admin: false } });
          });

          afterEach(() => {
            nock.cleanAll();
          });

          it('passes through error', () => {
            const req = {
              session,
              query: { repository_url: 'https://github.com/anowner/aname' }
            };
            const result = {
              authenticated: true,
              discharge: 'dummy-discharge'
            };
            return processVerifiedAssertion(req, res, next, null, result)
              .then(() => expect(processedError.message).toBe(
                'You do not have admin permissions for this GitHub ' +
                'repository'));
          });
        });
      });

      context('for a package_upload_request macaroon', () => {
        it('stores the discharge macaroon', () => {
          const req = {
            session,
            query: {}
          };
          const result = { authenticated: true, discharge: 'dummy-discharge' };
          return processVerifiedAssertion(req, res, next, null, result)
            .then(() => expect(session.ssoDischarge).toBe('dummy-discharge'));
        });

        it('redirects to /', () => {
          const req = {
            session,
            query: {}
          };
          const result = { authenticated: true, discharge: 'dummy-discharge' };
          return processVerifiedAssertion(req, res, next, null, result)
            .then(() => expect(res.redirectedUrl).toBe('/'));
        });
      });
    });
  });
});
