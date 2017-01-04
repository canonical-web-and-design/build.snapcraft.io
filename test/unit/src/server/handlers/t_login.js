import expect from 'expect';
import nock from 'nock';

import constants from '../../../../../src/server/constants';
import { processVerifiedAssertion } from '../../../../../src/server/handlers/login';
import { conf } from '../../../../../src/server/helpers/config.js';

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

  context('with OPENID_TEAMS', () => {
    before(() => {
      const overrides = conf.stores['test-overrides'];
      overrides.set('OPENID_TEAMS', ['team-name']);
    });

    after(() => {
      const overrides = conf.stores['test-overrides'];
      overrides.clear('OPENID_TEAMS');
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
    const session = { 'token': 'secret' };

    before(() => {
      const overrides = conf.stores['test-overrides'];
      overrides.set('LP_API_URL', 'http://localhost:4000/launchpad');
      overrides.set('LP_API_USERNAME', 'test-user');
      overrides.set('LP_API_CONSUMER_KEY', 'consumer key');
      overrides.set('LP_API_TOKEN', 'token key');
      overrides.set('LP_API_TOKEN_SECRET', 'token secret');
    });

    after(() => {
      const overrides = conf.stores['test-overrides'];
      overrides.clear('LP_API_URL');
      overrides.clear('LP_API_USERNAME');
      overrides.clear('LP_API_CONSUMER_KEY');
      overrides.clear('LP_API_TOKEN');
      overrides.clear('LP_API_TOKEN_SECRET');
    });

    context('when snap exists', () => {
      let completeAuthorizationScope;

      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: true } });
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;
        nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURL',
            url: 'https://github.com/anaccount/arepo'
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
        const req = {
          session,
          query: { repository_url: 'https://github.com/anaccount/arepo' }
        };
        const result = { authenticated: true, discharge: 'dummy-discharge' };
        return processVerifiedAssertion(req, res, next, null, result)
          .then(() => completeAuthorizationScope.done());
      });

      it('redirects', () => {
        const req = {
          session,
          query: { repository_url: 'https://github.com/anaccount/arepo' }
        };
        const result = { authenticated: true, discharge: 'dummy-discharge' };
        return processVerifiedAssertion(req, res, next, null, result)
          .then(() => expect(res.redirectedUrl).toBe('/'));
      });
    });

    context('when completing authorization throws an error', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: false } });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('passes through error', () => {
        const req = {
          session,
          query: { repository_url: 'https://github.com/anaccount/arepo' }
        };
        const result = { authenticated: true, discharge: 'dummy-discharge' };
        return processVerifiedAssertion(req, res, next, null, result)
          .then(() => expect(processedError.message).toBe(
            'You do not have admin permissions for this GitHub repository'));
      });
    });
  });
});
