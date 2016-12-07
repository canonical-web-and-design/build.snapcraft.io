import Express from 'express';
import supertest from 'supertest';
import nock from 'nock';
import expect from 'expect';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

import { conf } from '../../../../../src/server/helpers/config.js';
conf.set('GITHUB_AUTH_CLIENT_ID', 'akdjhoizxuclakjsdh');
conf.set('GITHUB_AUTH_CLIENT_SECRET', 'oiwuowiruncoiuihq3e');

const GITHUB_AUTH_LOGIN_URL = 'http://127.0.0.1/login/url';
const GITHUB_AUTH_CLIENT_ID = 'example_client_id';
const GITHUB_AUTH_REDIRECT_URL = 'http://127.0.0.1/redirect/url';
const GITHUB_AUTH_VERIFY_URL = 'http://127.0.0.1/verify/url';
const GITHUB_AUTH_CLIENT_SECRET = 'example_client_secret';

const mockConfigGetter = stub();
mockConfigGetter.withArgs('GITHUB_AUTH_LOGIN_URL').returns(GITHUB_AUTH_LOGIN_URL);
mockConfigGetter.withArgs('GITHUB_AUTH_CLIENT_ID').returns(GITHUB_AUTH_CLIENT_ID);
mockConfigGetter.withArgs('GITHUB_AUTH_REDIRECT_URL').returns(GITHUB_AUTH_REDIRECT_URL);
mockConfigGetter.withArgs('GITHUB_AUTH_VERIFY_URL').returns(GITHUB_AUTH_VERIFY_URL);
mockConfigGetter.withArgs('GITHUB_AUTH_CLIENT_SECRET').returns(GITHUB_AUTH_CLIENT_SECRET);

const login = proxyquire(
  '../../../../../src/server/routes/github-auth',
  {
    '../helpers/config': {
      conf: { get: mockConfigGetter }
    }
  }
).default;

describe('The login route', () => {
  let app;

  beforeEach(() => {
    app = Express();
    app.use((req, res, next) => {
      req.session = {
        sharedSecret: 'bar'
      };
      next();
    });
    app.use(login);
    app.use((err, req, res, next) => {
      res.status(500).send();
      next();
    });
  });

  describe('authenticate action', () => {
    it('should redirect to configured auth login page', (done) => {
      supertest(app)
        .get('/auth/authenticate')
        .expect('location', new RegExp(GITHUB_AUTH_LOGIN_URL))
        .expect(302)
        .end(done);
    });

    it('should supply configured GitHub client ID', (done) => {
      supertest(app)
        .get('/auth/authenticate')
        .expect('location', new RegExp(GITHUB_AUTH_CLIENT_ID))
        .end(done);
    });

    it('should supply configured redirect URL', (done) => {
      supertest(app)
        .get('/auth/authenticate')
        .expect('location', new RegExp(GITHUB_AUTH_REDIRECT_URL))
        .end(done);
    });

    it('should supply a shared secret', (done) => {
      supertest(app)
        .get('/auth/authenticate')
        .expect('location', /state/)
        .end(done);
    });

    it('should supply an authorization scope', (done) => {
      supertest(app)
        .get('/auth/authenticate')
        .expect('location', /scope/)
        .end(done);
    });
  });

  describe('verify action', () => {
    let scope;

    context('when token successfully exchanged', () => {
      beforeEach(() => {
        scope = nock(getHost(GITHUB_AUTH_VERIFY_URL))
          .post(getPath(GITHUB_AUTH_VERIFY_URL))
          .reply(200, 'access_token=baz');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return 500 error if received secret doesn\t match shared secret', (done) => {
        supertest(app)
          .get('/auth/verify')
          .query({ code: 'foo', state: 'foo' })
          .send()
          .expect(500, done);
      });

      it('should call GitHub API endpoint to get an auth token', (done) => {
        supertest(app)
          .get('/auth/verify')
          .query({ code: 'foo', state: 'bar' })
          .send()
          .end((err) => {
            scope.done();
            done(err);
          }
        );
      });

      it('should redirect request to site homepage', (done) => {
        supertest(app)
          .get('/auth/verify')
          .query({ code: 'foo', state: 'bar' })
          .send()
          .end((err, res) => {
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/');
            done(err);
          });
      });

    });

    context('when token exchange fails', () => {
      beforeEach(() => {
        scope = nock(getHost(GITHUB_AUTH_VERIFY_URL))
          .post(getPath(GITHUB_AUTH_VERIFY_URL))
          .reply(500);
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return 500 error', (done) => {
        supertest(app)
          .get('/auth/verify')
          .query({ code: 'foo', state: 'bar' })
          .send()
          .expect(500, done);
      });
    });
  });
});

function getHost(url) {
  return url.split(/\//)[0] + '//' + url.split(/\//)[2];
}

function getPath(url) {
  return url.replace(getHost(url), '');
}
