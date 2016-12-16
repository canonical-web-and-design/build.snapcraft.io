import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';

import { setMemcached } from '../../../../../src/server/handlers/launchpad';
import launchpad from '../../../../../src/server/routes/launchpad';
import { conf } from '../../../../../src/server/helpers/config.js';

describe('The Launchpad API endpoint', () => {
  const app = Express();
  const session = { 'token': 'secret' };
  app.use((req, res, next) => {
    req.session = session;
    next();
  });
  app.use(launchpad);

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

  describe('new snap route', () => {
    context('when user is not logged in', () => {
      const oldToken = session.token;

      before(() => {
        delete session.token;
      });

      after(() => {
        session.token = oldToken;
      });

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "not-logged-in" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('not-logged-in'))
          .end(done);
      });
    });

    context('when snap does not exist', () => {
      const caveatId = 'dummy caveat';

      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo/contents/snapcraft.yaml')
          .reply(200, 'name: test-snap\n');
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .post('/api/devel/+snaps')
          .query({ 'ws.op': 'new' })
          .reply(201, 'Created', {
            Location: `${lp_api_url}/api/devel/~test-user/+snap/test-snap`
          });
        nock(lp_api_url)
          .get('/api/devel/~test-user/+snap/test-snap')
          .reply(200, {
            resource_type_link: `${lp_api_url}/api/devel/#snap`,
            self_link: `${lp_api_url}/api/devel/~test-user/+snap/test-snap`
          });
        nock(lp_api_url)
          .post('/api/devel/~test-user/+snap/test-snap')
          .query({ 'ws.op': 'beginAuthorization' })
          .reply(200, JSON.stringify(caveatId), {
            'Content-Type': 'application/json'
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 201 Created response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(201, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a body with an appropriate caveat ID', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('snap-created', caveatId))
          .end(done);
      });
    });

    context('when snap already exists', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo/contents/snapcraft.yaml')
          .reply(200, 'name: test-snap\n');
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .post('/api/devel/+snaps')
          .query({ 'ws.op': 'new' })
          .reply(
            400,
            'There is already a snap package with the same name and owner.');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 400 Bad Request response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(400, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with an "lp-error" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage(
              'lp-error',
              'There is already a snap package with the same name and owner.'))
          .end(done);
      });
    });

    context('when repo URL cannot be parsed', () => {
      it('should return a 400 Bad Request response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'nonsense' })
          .expect(400, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'nonsense' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-bad-url" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'nonsense' })
          .expect(hasMessage('github-bad-url'))
          .end(done);
      });
    });

    context('when repo does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo/contents/snapcraft.yaml')
          .reply(404, { message: 'Not Found' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 Not Found response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-snapcraft-yaml-not-found" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('github-snapcraft-yaml-not-found'))
          .end(done);
      });
    });

    context('when authentication has failed', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo/contents/snapcraft.yaml')
          .reply(401, { message: 'Bad credentials' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-authentication-failed" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('github-authentication-failed'))
          .end(done);
      });
    });
  });

  describe('find snap route', () => {
    beforeEach(() => {
      const memcachedStub = { cache: {} };
      memcachedStub.get = (key, callback) => {
        callback(undefined, memcachedStub.cache[key]);
      };
      memcachedStub.set = (key, value, lifetime, callback) => {
        memcachedStub.cache[key] = value;
        callback(undefined, true);
      };
      setMemcached(memcachedStub);
    });

    afterEach(() => {
      setMemcached(null);
    });

    context('when snap exists', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/api/devel`;
        nock(lp_api_url)
          .get('/api/devel/+snaps')
          .query({
            'ws.op': 'findByURL',
            url: 'https://github.com/anaccount/arepo'
          })
          .reply(200, {
            total_size: 2,
            start: 0,
            entries: [
              {
                resource_type_link: `${lp_api_base}/#snap`,
                self_link: `${lp_api_base}/~another-user/+snap/test-snap`,
                owner_link: `${lp_api_base}/~another-user`
              },
              {
                resource_type_link: `${lp_api_base}/#snap`,
                self_link: `${lp_api_base}/~test-user/+snap/test-snap`,
                owner_link: `${lp_api_base}/~test-user`
              }
            ]
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 200 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a body with a "snap-found" message with the correct ' +
         'URL', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage(
            'snap-found',
            `${conf.get('LP_API_URL')}/api/devel/~test-user/+snap/test-snap`))
          .end(done);
      });
    });

    context('when snap does not exist', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .get('/api/devel/+snaps')
          .query({
            'ws.op': 'findByURL',
            url: 'https://github.com/anaccount/arepo'
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

      it('should return a 404 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(404, done);
      });

      it('should return an "error" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "snap-not-found" message', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('snap-not-found'))
          .end(done);
      });
    });

    context('when authentication has failed', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .get('/api/devel/+snaps')
          .query({
            'ws.op': 'findByURL',
            url: 'https://github.com/anaccount/arepo'
          })
          .reply(401, 'Bad OAuth token.');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(401, done);
      });

      it('should return an "error" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with an "lp-error" message', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('lp-error', 'Bad OAuth token.'))
          .end(done);
      });
    });
  });

  describe('complete snap authorization route', () => {
    beforeEach(() => {
      const memcachedStub = { cache: {} };
      memcachedStub.get = (key, callback) => {
        callback(undefined, memcachedStub.cache[key]);
      };
      memcachedStub.set = (key, value, lifetime, callback) => {
        memcachedStub.cache[key] = value;
        callback(undefined, true);
      };
      setMemcached(memcachedStub);
    });

    afterEach(() => {
      setMemcached(null);
    });

    context('when snap exists', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/api/devel`;
        nock(lp_api_url)
          .get('/api/devel/+snaps')
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
        nock(lp_api_url)
          .post('/api/devel/~test-user/+snap/test-snap')
          .query({
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

      it('should return a 200 OK response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a 200 OK response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(hasMessage(
            'snap-authorized',
            `${conf.get('LP_API_URL')}/api/devel/~test-user/+snap/test-snap`))
          .end(done);
      });
    });

    context('when snap does not exist', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .get('/api/devel/+snaps')
          .query({
            'ws.op': 'findByURL',
            url: 'https://github.com/anaccount/arepo'
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

      it('should return a 404 response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(404, done);
      });

      it('should return an "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "snap-not-found" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(hasMessage('snap-not-found'))
          .end(done);
      });
    });
  });
});

const hasStatus = (expected) => {
  return (actual) => {
    if (typeof actual.body.status === 'undefined' || actual.body.status !== expected) {
      throw new Error('Response does not have status ' + expected);
    }
  };
};

const hasMessage = (code, message) => {
  return (actual) => {
    if (typeof actual.body.payload === 'undefined'
        || typeof actual.body.payload.code === 'undefined'
        || actual.body.payload.code !== code) {
      throw new Error('Response does not have payload with code ' + code);
    }
    if (message !== undefined &&
        (actual.body.payload.message === 'undefined'
         || actual.body.payload.message !== message)) {
      throw new Error('Response does not have payload with message ' +
                      message);
    }
  };
};
