// load server/server.js via proxyquire to stub webpack-assets.json
import proxyquire from 'proxyquire';

// import login routes for testing
import loginRoutes from '../../src/server/routes/login';

const routesStub = {
  login: loginRoutes,
  api: () => {},
  universal: () => {},
  // tell proxyquire not to try to load stubbed module
  '@noCallThru': true
};
const stubDependencies = {
  './routes/': routesStub
};

const app = proxyquire(
  '../../src/server/server.js',
  stubDependencies
).default;

import { conf } from '../../src/server/helpers/config';
import nock from 'nock';
import supertest from 'supertest';

const SSO_HOST = conf.get('UBUNTU_SSO_HOST');
const VERIFY_URL = conf.get('OPENID_VERIFY_URL');

describe('login routes', () => {

  afterEach(() => {
    nock.cleanAll();
  });

  describe('authenticate', () => {
    it('should redirect from /login/authenticate to SSO', (done) => {
      supertest(app)
        .get('/login/authenticate')
        .expect('location', new RegExp(SSO_HOST))
        .expect(302, done);
    });

    it('should include verify url in redirect header', (done) => {
      supertest(app)
        .get('/login/authenticate')
        .expect('location',
          new RegExp(encodeURIComponent(VERIFY_URL)),
          done
        );
    });
  });
});
