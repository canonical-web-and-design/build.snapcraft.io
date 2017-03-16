import expect from 'expect';
import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';
import url from 'url';

import login from '../../../../../src/server/routes/login';
import { conf } from '../../../../../src/server/helpers/config';

const UBUNTU_SSO_URL = conf.get('UBUNTU_SSO_URL');
const OPENID_VERIFY_URL = conf.get('OPENID_VERIFY_URL');

describe('login routes', () => {
  const app = Express();
  const session = {};
  app.use((req, res, next) => {
    req.session = session;
    next();
  });
  app.use(login);

  describe('authenticate', () => {
    let sso;

    beforeEach(() => {
      sso = nock(UBUNTU_SSO_URL)
        .get('/')
        .reply(
          200, [
            '<?xml version="1.0"?>',
            '<xrds:XRDS',
            '    xmlns="xri://$xrd*($v*2.0)"',
            '    xmlns:xrds="xri://$xrds">',
            '  <XRD>',
            '    <Service priority="0">',
            '      <Type>http://specs.openid.net/auth/2.0/server</Type>',
            '      <Type>http://openid.net/srv/ax/1.0</Type>',
            '      <Type>http://openid.net/extensions/sreg/1.1</Type>',
            '      <Type>http://ns.launchpad.net/2007/openid-teams</Type>',
            '      <Type>http://ns.login.ubuntu.com/2016/openid-macaroon</Type>',
            `      <URI>${UBUNTU_SSO_URL}/+openid</URI>`,
            '    </Service>',
            '  </XRD>',
            '</xrds:XRDS>'
          ].join('\n') + '\n',
          { 'Content-Type': 'application/xrds+xml' })
        .post('/+openid')
        .reply(
          200, [
            'assoc_handle:{HMAC-SHA256}{5855f159}{F2z7DQ==}',
            'assoc_type:HMAC-SHA256',
            // Fixed mock keys for testing.  We just need to get far enough to
            // get past openid.associate.
            'dh_server_public:AMZnmSsNwiqdfff0SpwNjW/rILcNfCym/bLP5khI3wI7XcZxB8mJk6JqE3+KR3uAisTa3qgR/2mFYN4ruD8lS5rdJnkXnLAqGrpQDUTKlzxB/Nk5w3XvsJkslmeTtka+h8lMIypY+m3tOiTYKR+pkX++OHsLwRldC6qxJH0ZWTat',
            'enc_mac_key:RMGAA+oKkhayYZlqmxt2E7BmjVyO5eyMULQyD9ZEXvc=',
            'expires_in:1209600',
            'ns:http://specs.openid.net/auth/2.0',
            'session_type:DH-SHA256'
          ].join('\n') + '\n');
    });

    afterEach(() => {
      nock.cleanAll();
    });

    context('with no options', () => {
      it('should redirect from /login/authenticate to SSO', async () => {
        const res = await supertest(app)
          .get('/login/authenticate')
          .expect(302);
        const expectedBaseUrl = url.parse(UBUNTU_SSO_URL);
        expect(url.parse(res.header.location)).toMatch({
          protocol: expectedBaseUrl.protocol,
          host: expectedBaseUrl.host
        });
        sso.done();
      });

      it('should include verify url in redirect header', async () => {
        const res = await supertest(app)
          .get('/login/authenticate');
        const parsedLocation = url.parse(res.header.location, true);
        expect(parsedLocation.query['openid.return_to'])
          .toEqual(OPENID_VERIFY_URL);
        sso.done();
      });

      it('should not include macaroon extension in redirect ' +
         'header', async () => {
        const res = await supertest(app)
          .get('/login/authenticate');
        const parsedLocation = url.parse(res.header.location, true);
        expect(parsedLocation.query).toExcludeKey('openid.ns.macaroon');
        expect(parsedLocation.query).toExcludeKey('openid.macaroon.caveat_id');
        sso.done();
      });
    });

    context('with options', () => {
      it('should redirect from /login/authenticate to SSO', async () => {
        const res = await supertest(app)
          .get('/login/authenticate')
          .query({ 'starting_url': 'http://www.example.com/origin' })
          .query({ 'caveat_id': 'dummy caveat' })
          .expect(302);
        const expectedBaseUrl = url.parse(UBUNTU_SSO_URL);
        expect(url.parse(res.header.location)).toMatch({
          protocol: expectedBaseUrl.protocol,
          host: expectedBaseUrl.host
        });
        sso.done();
      });

      it('should include verify url in redirect header', async () => {
        const res = await supertest(app)
          .get('/login/authenticate')
          .query({ 'starting_url': 'http://www.example.com/origin' })
          .query({ 'caveat_id': 'dummy caveat' });
        const parsedLocation = url.parse(res.header.location, true);
        const expectedReturnTo =
          OPENID_VERIFY_URL +
          '?starting_url=http%3A%2F%2Fwww.example.com%2Forigin' +
          '&caveat_id=dummy%20caveat';
        expect(parsedLocation.query['openid.return_to'])
          .toEqual(expectedReturnTo);
        sso.done();
      });

      it('should include macaroon extension in redirect header', async () => {
        const expectedCaveatId = 'dummy caveat';
        const res = await supertest(app)
          .get('/login/authenticate')
          .query({ 'starting_url': 'http://www.example.com/origin' })
          .query({ 'caveat_id': expectedCaveatId });
        const parsedLocation = url.parse(res.header.location, true);
        expect(parsedLocation.query['openid.ns.macaroon'])
          .toEqual('http://ns.login.ubuntu.com/2016/openid-macaroon');
        expect(parsedLocation.query['openid.macaroon.caveat_id'])
          .toEqual(expectedCaveatId);
        sso.done();
      });
    });
  });

  describe('sso-discharge', () => {
    context('if session has discharge macaroon', () => {
      beforeEach(() => {
        session.ssoDischarge = 'dummy macaroon';
      });

      afterEach(() => {
        delete session.ssoDischarge;
      });

      it('GET returns the macaroon', async () => {
        const res = await supertest(app)
          .get('/login/sso-discharge')
          .expect(200);
        expect(res.body).toEqual({
          status: 'success',
          payload: {
            code: 'discharge-found',
            discharge: 'dummy macaroon'
          }
        });
      });

      it('DELETE deletes the macaroon', async () => {
        await supertest(app)
          .delete('/login/sso-discharge')
          .expect(204);
        expect(session.ssoDischarge).toNotExist();
      });
    });

    context('if user is logged in but has no SSO discharge', () => {
      beforeEach(() => {
        delete session.ssoDischarge;
      });

      it('GET returns 404', async () => {
        const res = await supertest(app)
          .get('/login/sso-discharge')
          .expect(404);
        expect(res.body).toEqual({
          status: 'error',
          payload: {
            code: 'discharge-not-found',
            message: 'No SSO discharge macaroon stored'
          }
        });
      });

      it('DELETE does nothing', async () => {
        await supertest(app)
          .delete('/login/sso-discharge')
          .expect(204);
        expect(session.ssoDischarge).toNotExist();
      });
    });
  });
});
