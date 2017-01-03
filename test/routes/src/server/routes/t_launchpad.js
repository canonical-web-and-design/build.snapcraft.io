import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';
import expect from 'expect';

import {
  getMemcached,
  resetMemcached,
  setupInMemoryMemcached
} from '../../../../../src/server/helpers/memcached';
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
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: true } });
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo/contents/snapcraft.yaml')
          .reply(200, 'name: test-snap\n');
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .post('/devel/+snaps', {
            'ws.op': 'new',
            git_repository_url: 'https://github.com/anaccount/arepo',
            processors: ['/+processors/amd64', '/+processors/armhf'],
            store_name: 'test-snap'
          })
          .reply(201, 'Created', {
            Location: `${lp_api_url}/devel/~test-user/+snap/test-snap`
          });
        nock(lp_api_url)
          .get('/devel/~test-user/+snap/test-snap')
          .reply(200, {
            resource_type_link: `${lp_api_url}/devel/#snap`,
            self_link: `${lp_api_url}/devel/~test-user/+snap/test-snap`
          });
        nock(lp_api_url)
          .post('/devel/~test-user/+snap/test-snap', {
            'ws.op': 'beginAuthorization'
          })
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
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: true } });
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo/contents/snapcraft.yaml')
          .reply(200, 'name: test-snap\n');
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .post('/devel/+snaps', { 'ws.op': 'new' })
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

    context('when user has no admin permissions on GitHub repository', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: false } });
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

      it('should return a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('github-no-admin-permissions'))
          .end(done);
      });
    });

    context('when repo does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
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
          .get('/repos/anaccount/arepo')
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

    context('when snap exists', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;
        nock(lp_api_url)
          .get('/devel/+snaps')
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
            `${conf.get('LP_API_URL')}/devel/~test-user/+snap/test-snap`))
          .end(done);
      });
    });

    context('when snap does not exist', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .get('/devel/+snaps')
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
          .get('/devel/+snaps')
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

    context('when repository is memcached', () => {
      const repositoryUrl = 'https://github.com/anaccount/arepo';
      const snapUrl = `${conf.get('LP_API_URL')}/devel/~test-user/+snap/test-snap`;

      before(() => {
        setupInMemoryMemcached();
        getMemcached().set(`url:${repositoryUrl}`, snapUrl);
      });

      after(() => {
        resetMemcached();
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

      it('should return a body with a "snap-found" message with the correct URL', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('snap-found', snapUrl))
          .end(done);
      });

    });

  });

  describe('complete snap authorization route', () => {

    context('when snap exists', () => {
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
        nock(lp_api_url)
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
            `${conf.get('LP_API_URL')}/devel/~test-user/+snap/test-snap`))
          .end(done);
      });
    });

    context('when snap does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: true } });
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .get('/devel/+snaps')
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

    context('when user has no admin permissions on GitHub repository', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: false } });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/complete-authorization')
          .send({
            repository_url: 'https://github.com/anaccount/arepo',
            discharge_macaroon: 'dummy-discharge'
          })
          .expect(hasMessage('github-no-admin-permissions'))
          .end(done);
      });
    });
  });

  describe('get snap builds route', () => {
    const lp_snap_user = 'test-snap-user';
    const lp_snap_name = 'test-snap-name';

    let lp_api_url;
    let lp_snap_path;
    let lp_builds_path;
    let lp_snap_url;

    before(() => {
      lp_api_url = conf.get('LP_API_URL');
      lp_snap_path = `/devel/~${lp_snap_user}/+snap/${lp_snap_name}`;
      lp_builds_path = `${lp_snap_path}/builds`;

      lp_snap_url = `${lp_api_url}${lp_snap_path}`;
    });

    context('when snap and builds are successfully fetched', () => {
      let test_build;

      beforeEach(() => {
        test_build = {
          'resource_type_link': `${lp_api_url}/devel/#snap_build`,
          'self_link': `${lp_api_url}${lp_snap_path}/+build/12345`,
        };

        // when getting snap data from API (via self_link)
        nock(lp_api_url)
          .get(lp_snap_path)
          .reply(200, {
            name: lp_snap_name,
            builds_collection_link: `${lp_api_url}${lp_builds_path}`
          });

        // when getting builds list (via builds_collection_link)
        nock(lp_api_url)
          .get(lp_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(200, {
            total_size: 1,
            start: 0,
            entries: [ test_build ]
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 200 OK response', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return body with "snap-builds-found" message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(hasMessage('snap-builds-found'))
          .end(done);
      });

      it('should return builds list in payload', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .end((err, res) => {
            const build = res.body.payload.builds[0];
            // XXX bartaz
            // Wanted to use `expect(build).toEqual(test_build)`
            // but LP client adds more propeties to the object...
            // also `expect(build).toContain(test_build)` doesnt work
            // because `expect` fails to iterate over keys on the object
            // for some reason (async maybe).
            // To be investigated later...
            expect(build.self_link).toEqual(test_build.self_link);
            done(err);
          });
      });

    });

    context('when passing start and size params', () => {

      beforeEach(() => {
        // when getting snap data from API (via self_link)
        nock(lp_api_url)
          .get(lp_snap_path)
          .reply(200, {
            name: lp_snap_name,
            builds_collection_link: `${lp_api_url}${lp_builds_path}`
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should default start to 0 and size to 10', (done) => {
        // when getting builds list (via builds_collection_link)
        const lp = nock(lp_api_url)
          .get(lp_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(200,{ entries: [] });

        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(200, (err) => {
            lp.done();
            done(err);
          });
      });

      it('should pass start and size params to builds_collection_link call', (done) => {
        // when getting builds list (via builds_collection_link)
        const lp = nock(lp_api_url)
          .get(lp_builds_path)
          .query({
            'ws.start': 7,
            'ws.size': 42
          })
          .reply(200, { entries: [] });

        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url, size: 42, start: 7 })
          .expect(200, (err) => {
            lp.done();
            done(err);
          });
      });

    });

    context('when builds fail to fetch', () => {

      beforeEach(() => {
        // when getting snap data from API (via self_link)
        nock(lp_api_url)
          .get(lp_snap_path)
          .reply(200, {
            name: lp_snap_name,
            builds_collection_link: `${lp_api_url}${lp_builds_path}`
          });

        // when getting builds list (via builds_collection_link)
        nock(lp_api_url)
          .get(lp_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(404, 'Not found');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 response', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return body with error message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(hasMessage('lp-error', 'Not found'))
          .end(done);
      });

    });

    context('when snap fails to fetch', () => {

      beforeEach(() => {
        // when getting snap data from API (via self_link)
        nock(lp_api_url)
          .get(lp_snap_path)
          .reply(404, 'Not found');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 response', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return body with error message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .query({ snap: lp_snap_url })
          .expect(hasMessage('lp-error', 'Not found'))
          .end(done);
      });

    });

    context('when snap parameter is missing', () => {

      it('should return a 404 response', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
        .get('/launchpad/builds')
        .expect(hasStatus('error'))
        .end(done);
      });

      it('should return body with error message', (done) => {
        supertest(app)
        .get('/launchpad/builds')
        .expect(hasMessage('missing-snap-link'))
        .end(done);
      });

    });

  });

  describe('request snap builds route', () => {
    const lp_snap_user = 'test-user';
    const lp_snap_path = `/~${lp_snap_user}/+snap/test-snap`;

    context('when snap exists', () => {
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
                self_link: `${lp_api_base}${lp_snap_path}`,
                owner_link: `${lp_api_base}/~${lp_snap_user}`
              }
            ]
          });
        nock(lp_api_url)
          .post(`/devel${lp_snap_path}`, {
            'ws.op': 'requestAutoBuilds'
          })
          .reply(200, {
            total_size: 2,
            start: 0,
            entries: [
              {
                resource_type_link: `${lp_api_base}/#snap_build`,
                self_link: `${lp_api_base}${lp_snap_path}/+build/1`
              },
              {
                resource_type_link: `${lp_api_base}/#snap_build`,
                self_link: `${lp_api_base}${lp_snap_path}/+build/2`
              }
            ]
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('returns a 201 Created response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(201, done);
      });

      it('returns a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('returns body with a "snap-builds-requested" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('snap-builds-requested'))
          .end(done);
      });

      it('returns requested builds list in payload', (done) => {
        const lp_api_base = `${conf.get('LP_API_URL')}/devel`;
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect((res) => {
            const buildUrls = res.body.payload.builds.map((entry) => {
              return entry.self_link;
            });
            expect(buildUrls).toEqual([
              `${lp_api_base}${lp_snap_path}/+build/1`,
              `${lp_api_base}${lp_snap_path}/+build/2`
            ]);
          })
          .end(done);
      });
    });

    context('when user has no admin permissions on GitHub repository', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: false } });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('github-no-admin-permissions'))
          .end(done);
      });
    });

    context('when repo does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(404, { message: 'Not Found' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 Not Found response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-snapcraft-yaml-not-found" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasMessage('github-snapcraft-yaml-not-found'))
          .end(done);
      });
    });

    context('when snap does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anaccount/arepo')
          .reply(200, { permissions: { admin: true } });
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .get('/devel/+snaps')
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

      it('returns a 404 response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(404, done);
      });

      it('returns an "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('returns body with a "snap-not-found" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anaccount/arepo' })
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
