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
import { getSnapcraftYamlCacheId } from '../../../../../src/server/handlers/github';
import {
  getUrlPrefixCacheId,
  getRepositoryUrlCacheId
} from '../../../../../src/server/handlers/launchpad';
import { conf } from '../../../../../src/server/helpers/config.js';

describe('The Launchpad API endpoint', () => {
  const app = Express();
  const session = { 'token': 'secret' };
  app.use((req, res, next) => {
    req.session = session;
    next();
  });
  app.use(launchpad);

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
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "not-logged-in" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('not-logged-in'))
          .end(done);
      });
    });

    context('when user has admin permissions on repository', () => {
      const snapName = 'dummy-test-snap';

      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: true } });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      context('when snap already exists', () => {

        beforeEach(() => {
          const lp_api_url = conf.get('LP_API_URL');
          nock(lp_api_url)
            .post('/devel/+snaps', { 'ws.op': 'new' })
            .reply(
              400,
              'There is already a snap package with the same name and owner.');
        });

        it('should return a 400 Bad Request response', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(400, done);
        });

        it('should return a "error" status', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasStatus('error'))
            .end(done);
        });

        it('should return a body with an "lp-error" message', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasMessage(
                'lp-error',
                'There is already a snap package with the same name and owner.'))
            .end(done);
        });
      });

      context('when snap does not exist', () => {
        let snapUrl;

        beforeEach(() => {
          const lp_api_url = conf.get('LP_API_URL');
          snapUrl = `${lp_api_url}/devel/~test-user/+snap/${snapName}`;
          nock(lp_api_url)
            .post('/devel/+snaps', {
              'ws.op': 'new',
              git_repository_url: 'https://github.com/anowner/aname',
              auto_build: 'false',
              processors: ['/+processors/amd64', '/+processors/armhf']
            })
            .reply(201, 'Created', { Location: snapUrl });
          nock(lp_api_url)
            .get(`/devel/~test-user/+snap/${snapName}`)
            .reply(200, {
              resource_type_link: `${lp_api_url}/devel/#snap`,
              self_link: snapUrl
            });
        });

        it('should return a 201 Created response', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(201, done);
        });

        it('should return a "success" status', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasStatus('success'))
            .end(done);
        });

        it('should return a body with the new snap URL', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasMessage('snap-created', snapUrl))
            .end(done);
        });
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
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: false } });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-no-admin-permissions'))
          .end(done);
      });
    });

    context('when repo does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(404, { message: 'Not Found' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 Not Found response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-snapcraft-yaml-not-found" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-snapcraft-yaml-not-found'))
          .end(done);
      });
    });

    context('when authentication has failed', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(401, { message: 'Bad credentials' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-authentication-failed" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-authentication-failed'))
          .end(done);
      });
    });
  });

  describe('list snaps route', () => {

    context('when snaps exist', () => {
      let testSnaps;

      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;

        testSnaps = [
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~another-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~another-user`,
            git_repository_url: 'http://github.com/another-user/test-snap'
          },
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~test-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~test-user`,
            git_repository_url: 'https://github.com/test-user/test-snap'
          }
        ];

        const contents = {
          'https://github.com/another-user/test-snap': { name: 'snap1' },
          'https://github.com/test-user/test-snap': {}
        };

        const api = nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURLPrefix',
            url_prefix: 'https://github.com/anowner/',
            owner: `/~${conf.get('LP_API_USERNAME')}`
          })
          .reply(200, {
            total_size: 2,
            start: 0,
            entries: testSnaps
          });

        testSnaps.map((snap) => {
          const fullName = snap.git_repository_url.replace('http://github.com/', '');
          const scope = api.get(
            `/repos/${fullName}/contents/snapcraft.yaml`
          );
          const repoContents = contents[snap.git_repository_url];
          if (repoContents !== undefined) {
            return scope.reply(200, repoContents);
          } else {
            return scope.reply(404);
          }
        });

      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 200 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return "snaps-found" message with the correct snaps', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .end((err, res) => {
            const responseSnaps = res.body.payload.snaps;

            expect(responseSnaps.length).toEqual(testSnaps.length);
            expect(responseSnaps[0]).toContain(testSnaps[0]);

            done(err);
          });
      });

      context('using memcached', () => {
        beforeEach(() => {
          setupInMemoryMemcached();
        });

        afterEach(() => {
          resetMemcached();
        });

        it('should store snaps in memcached', (done) => {

          const urlPrefix = 'https://github.com/anowner/';
          const cacheId = getUrlPrefixCacheId(urlPrefix);

          supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .end((err) => {
            const memcachedSnaps = getMemcached().cache[cacheId];
            expect(memcachedSnaps.length).toEqual(testSnaps.length);
            expect(memcachedSnaps[0]).toContain(testSnaps[0]);
            done(err);
          });
        });

      });

    });

    context('when snaps don\'t exist', () => {


      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');

        nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURLPrefix',
            url_prefix: 'https://github.com/anowner/',
            owner: `/~${conf.get('LP_API_USERNAME')}`
          })
          .reply(200, {
            total_size: 2,
            start: 0,
            entries: []
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 200 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return "snaps-found" message with empty list', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .end((err, res) => {
            const responseSnaps = res.body.payload.snaps;

            expect(responseSnaps.length).toEqual(0);

            done(err);
          });
      });
    });

    context('when LP returns error', () => {
      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURLPrefix',
            url_prefix: 'https://github.com/anowner/',
            owner: `/~${conf.get('LP_API_USERNAME')}`
          })
          .reply(501, 'Something went quite wrong.');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return an error response', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .expect(501, done);
      });

      it('should return an "error" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with an "lp-error" message', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .expect(hasMessage('lp-error', 'Something went quite wrong.'))
          .end(done);
      });
    });


    context('when snaps are memcached', () => {
      const urlPrefix = 'https://github.com/anowner/';
      let testSnaps;

      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;

        testSnaps = [
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~another-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~another-user`,
            git_repository_url: 'https://github.com/another-user/test-snap'
          },
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~test-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~test-user`,
            git_repository_url: 'https://github.com/test-user/test-snap'
          }
        ];

        const contents = {
          'https://github.com/another-user/test-snap': { name: 'snap1' },
          'https://github.com/test-user/test-snap': {}
        };

        setupInMemoryMemcached({
          [getUrlPrefixCacheId(urlPrefix)]: testSnaps
        });

        testSnaps.map((snap) => {
          const cacheId = getSnapcraftYamlCacheId(snap.git_repository_url);
          getMemcached().cache[cacheId] = contents[snap.git_repository_url];
        });
      });

      afterEach(() => {
        resetMemcached();
      });

      it('should return a 200 response', (done) => {
        supertest(app)
        .get('/launchpad/snaps/list')
        .query({ owner: 'anowner' })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
        .get('/launchpad/snaps/list')
        .query({ owner: 'anowner' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return "snaps-found" message with the correct snaps', (done) => {
        supertest(app)
          .get('/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .end((err, res) => {
            const responseSnaps = res.body.payload.snaps;

            expect(responseSnaps.length).toEqual(testSnaps.length);
            expect(responseSnaps[0]).toContain(testSnaps[0]);

            done(err);
          });
      });

    });

  });

  describe('find snap route', () => {

    context('when snap exists', () => {
      let testSnaps;

      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;

        testSnaps = [
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
        ];

        nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURL',
            url: 'https://github.com/anowner/aname'
          })
          .reply(200, {
            total_size: 2,
            start: 0,
            entries: testSnaps
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 200 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a body with a "snap-found" message with the correct snap', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('snap-found'))
          .expect((res) => {
            expect(res.body.payload.snap).toEqual(testSnaps[1]);
          })
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

      it('should return a 404 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(404, done);
      });

      it('should return an "error" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "snap-not-found" message', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
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
            url: 'https://github.com/anowner/aname'
          })
          .reply(401, 'Bad OAuth token.');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(401, done);
      });

      it('should return an "error" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with an "lp-error" message', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('lp-error', 'Bad OAuth token.'))
          .end(done);
      });
    });

    context('when repository is memcached', () => {
      const repositoryUrl = 'https://github.com/anowner/aname';
      const snap = {
        self_link: `${conf.get('LP_API_URL')}/devel/~test-user/+snap/test-snap`
      };


      before(() => {
        setupInMemoryMemcached();
        getMemcached().cache[getRepositoryUrlCacheId(repositoryUrl)] = snap;
      });

      after(() => {
        resetMemcached();
      });

      it('should return a 200 response', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a body with a "snap-found" message with the correct snap', (done) => {
        supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('snap-found'))
          .expect((res) => {
            expect(res.body.payload.snap).toEqual(snap);
          })
          .end(done);
      });

    });

  });

  describe('authorize snap route', () => {
    const snapName = 'dummy-test-snap';

    afterEach(() => {
      nock.cleanAll();
    });

    context('when user has no admin permissions on GitHub repository', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: false } });
      });

      it('returns a "github-no-admin-permissions" error', (done) => {
        supertest(app)
          .post('/launchpad/snaps/authorize')
          .send({
            repository_url: 'https://github.com/anowner/aname',
            snap_name: snapName,
            series: '16',
            channels: ['edge'],
            macaroon: 'dummy-macaroon'
          })
          .expect((res) => {
            expect(res.statusCode).toEqual(401);
            expect(res.body.payload.code)
              .toEqual('github-no-admin-permissions');
          })
          .end(done);
      });
    });

    context('when user has admin permissions on GitHub repository', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: true } });
      });

      context('when snap does not exist', () => {
        beforeEach(() => {
          const lpApiUrl = conf.get('LP_API_URL');
          nock(lpApiUrl)
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

        it('returns a "snap-not-found" error', (done) => {
          supertest(app)
            .post('/launchpad/snaps/authorize')
            .send({
              repository_url: 'https://github.com/anowner/aname',
              snap_name: snapName,
              series: '16',
              channels: ['edge'],
              macaroon: 'dummy-macaroon'
            })
            .expect((res) => {
              expect(res.statusCode).toEqual(404);
              expect(res.body.payload.code).toEqual('snap-not-found');
            })
            .end(done);
        });
      });

      context('when snap exists', () => {
        const lpApiUrl = conf.get('LP_API_URL');
        const lpApiBase = `${lpApiUrl}/devel`;
        let lpScope;

        beforeEach(() => {
          lpScope = nock(lpApiUrl);
          lpScope
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
                  resource_type_link: `${lpApiBase}/#snap`,
                  self_link: `${lpApiBase}/~test-user/+snap/test-snap`,
                  owner_link: `${lpApiBase}/~test-user`
                }
              ]
            });
        });

        context('when setting snap attributes fails', () => {
          beforeEach(() => {
            lpScope
              .post('/devel/~test-user/+snap/test-snap', {
                store_upload: true,
                store_series_link: '/+snappy-series/16',
                store_name: snapName,
                store_channels: ['edge']
              })
              .matchHeader('X-HTTP-Method-Override', 'PATCH')
              .reply(503, 'Service unavailable');
          });

          it('returns an "lp-error" error', (done) => {
            supertest(app)
              .post('/launchpad/snaps/authorize')
              .send({
                repository_url: 'https://github.com/anowner/aname',
                snap_name: snapName,
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-macaroon'
              })
              .expect((res) => {
                expect(res.statusCode).toEqual(503);
                expect(res.body.payload.code).toEqual('lp-error');
              })
              .end(done);
          });
        });

        context('when setting snap attributes succeeds', () => {
          beforeEach(() => {
            lpScope
              .post('/devel/~test-user/+snap/test-snap', {
                store_upload: true,
                store_series_link: '/+snappy-series/16',
                store_name: snapName,
                store_channels: ['edge']
              })
              .matchHeader('X-HTTP-Method-Override', 'PATCH')
              .reply(200, {
                resource_type_link: `${lpApiUrl}/devel/#snap`,
                self_link: `${lpApiUrl}/~test-user/+snap/test-snap`
              });
            lpScope
              .post('/devel/~test-user/+snap/test-snap', {
                'ws.op': 'completeAuthorization',
                'root_macaroon': 'dummy-macaroon'
              })
              .reply(200, 'null', {
                'Content-Type': 'application/json'
              });
          });

          it('completes the authorization', (done) => {
            supertest(app)
              .post('/launchpad/snaps/authorize')
              .send({
                repository_url: 'https://github.com/anowner/aname',
                snap_name: snapName,
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-macaroon'
              })
              .expect(200, (err) => {
                lpScope.done();
                done(err);
              });
          });

          context('when snaps are memcached', () => {
            const urlPrefix = 'https://github.com/anowner/';
            const repositoryUrl = 'https://github.com/anowner/aname';
            let snap;

            beforeEach(() => {
              snap = {
                resource_type_link: `${lpApiBase}/#snap`,
                self_link: `${lpApiBase}/~test-user/+snap/test-snap`,
                owner_link: `${lpApiBase}/~test-user`,
                git_repository_url: repositoryUrl
              };

              // fill snap listing and snapcraft.yaml data caches
              setupInMemoryMemcached({
                [getUrlPrefixCacheId(urlPrefix)]: [ snap ],
                [getSnapcraftYamlCacheId(repositoryUrl)]: {
                  name: 'test-snap-name'
                }
              });
              // find snap by url cache will be filled by API call

              // getMemcached().cache[getUrlPrefixCacheId(urlPrefix)] = [ snap ];
              // getMemcached().cache
            });

            afterEach(() => {
              resetMemcached();
            });

            it('clears memcached snaps data', (done) => {
              supertest(app)
                .post('/launchpad/snaps/authorize')
                .send({
                  repository_url: 'https://github.com/anowner/aname',
                  snap_name: snapName,
                  series: '16',
                  channels: ['edge'],
                  macaroon: 'dummy-macaroon'
                })
                .end((err) => {
                  lpScope.done();
                  // it's our own in memory memcached stub,
                  // so we can rely on internal .cache
                  expect(getMemcached().cache).toExcludeKeys([
                    getUrlPrefixCacheId(urlPrefix),
                    getRepositoryUrlCacheId(repositoryUrl),
                    getSnapcraftYamlCacheId(repositoryUrl)
                  ]);
                  done(err);
                });
            });
          });
        });
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
    const lp_api_url = conf.get('LP_API_URL');
    const lp_api_base = `${lp_api_url}/devel`;
    const lp_snap_user = 'test-user';
    const lp_snap_path = `/~${lp_snap_user}/+snap/test-snap`;
    let api;

    context('when snap exists', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: true } });
        api = nock(lp_api_url);
        api.post(`/devel${lp_snap_path}`, {
          'ws.op': 'requestAutoBuilds'
        })
          .reply(200, [
            {
              resource_type_link: `${lp_api_base}/#snap_build`,
              self_link: `${lp_api_base}${lp_snap_path}/+build/1`
            },
            {
              resource_type_link: `${lp_api_base}/#snap_build`,
              self_link: `${lp_api_base}${lp_snap_path}/+build/2`
            }
          ]);
      });

      afterEach(() => {
        nock.cleanAll();
      });

      context('when auto_build is false', () => {
        beforeEach(() => {
          api.get('/devel/+snaps')
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
                  self_link: `${lp_api_base}${lp_snap_path}`,
                  owner_link: `${lp_api_base}/~${lp_snap_user}`,
                  auto_build: false
                }
              ]
            });
          api.post(`/devel${lp_snap_path}`, { auto_build: true })
            .matchHeader('X-HTTP-Method-Override', 'PATCH')
            .reply(200, {
              resource_type_link: `${lp_api_base}/#snap`,
              self_link: `${lp_api_base}${lp_snap_path}`
            });
        });

        it('returns a 201 Created response', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(201)
            .end((err) => {
              api.done();
              done(err);
            });
        });

        it('returns a "success" status', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasStatus('success'))
            .end((err) => {
              api.done();
              done(err);
            });
        });

        it('returns body with a "snap-builds-requested" message', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasMessage('snap-builds-requested'))
            .end((err) => {
              api.done();
              done(err);
            });
        });

        it('returns requested builds list in payload', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect((res) => {
              const buildUrls = res.body.payload.builds.map((entry) => {
                return entry.self_link;
              });
              expect(buildUrls).toEqual([
                `${lp_api_base}${lp_snap_path}/+build/1`,
                `${lp_api_base}${lp_snap_path}/+build/2`
              ]);
            })
            .end((err) => {
              api.done();
              done(err);
            });
        });
      });

      context('when auto_build is true', () => {
        beforeEach(() => {
          api.get('/devel/+snaps')
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
                  self_link: `${lp_api_base}${lp_snap_path}`,
                  owner_link: `${lp_api_base}/~${lp_snap_user}`,
                  auto_build: true
                }
              ]
            });
        });

        it('returns a 201 Created response', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(201)
            .end((err) => {
              api.done();
              done(err);
            });
        });

        it('returns a "success" status', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasStatus('success'))
            .end((err) => {
              api.done();
              done(err);
            });
        });

        it('returns body with a "snap-builds-requested" message', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasMessage('snap-builds-requested'))
            .end((err) => {
              api.done();
              done(err);
            });
        });

        it('returns requested builds list in payload', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect((res) => {
              const buildUrls = res.body.payload.builds.map((entry) => {
                return entry.self_link;
              });
              expect(buildUrls).toEqual([
                `${lp_api_base}${lp_snap_path}/+build/1`,
                `${lp_api_base}${lp_snap_path}/+build/2`
              ]);
            })
            .end((err) => {
              api.done();
              done(err);
            });
        });
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

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-no-admin-permissions'))
          .end(done);
      });
    });

    context('when repo does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(404, { message: 'Not Found' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 Not Found response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-snapcraft-yaml-not-found" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-snapcraft-yaml-not-found'))
          .end(done);
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

      it('returns a 404 response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(404, done);
      });

      it('returns an "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('returns body with a "snap-not-found" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('snap-not-found'))
          .end(done);
      });
    });
  });

  describe('delete snap route', () => {
    const lp_snap_user = 'test-user';
    const lp_snap_path = `/~${lp_snap_user}/+snap/test-snap`;
    const repositoryUrl = 'https://github.com/anowner/aname';

    beforeEach(() => {
      setupInMemoryMemcached();
    });

    afterEach(() => {
      resetMemcached();
    });

    context('when snap exists', () => {
      const urlPrefix = 'https://github.com/anowner/';

      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: true } });
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;
        const testSnap = {
          resource_type_link: `${lp_api_base}/#snap`,
          self_link: `${lp_api_base}${lp_snap_path}`,
          owner_link: `${lp_api_base}/~${lp_snap_user}`,
          git_repository_url: repositoryUrl
        };
        nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURL',
            url: repositoryUrl
          })
          .reply(200, {
            total_size: 1,
            start: 0,
            entries: [testSnap]
          });
        nock(lp_api_url)
          .delete(`/devel${lp_snap_path}`)
          .reply(200, 'null', { 'Content-Type': 'application/json' });
        setupInMemoryMemcached();
        getMemcached().cache[getUrlPrefixCacheId(urlPrefix)] = [testSnap];
      });

      afterEach(() => {
        resetMemcached();
        nock.cleanAll();
      });

      it('returns a 200 response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(200, done);
      });

      it('returns a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('returns body with a "snap-deleted" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('snap-deleted'))
          .end(done);
      });

      it('removes stale entries from memcached', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .end((err) => {
            if (err) {
              done(err);
            }
            const prefixCacheId = getUrlPrefixCacheId(urlPrefix);
            const repoCacheId = getRepositoryUrlCacheId(repositoryUrl);
            expect(getMemcached().cache).toExcludeKey(prefixCacheId);
            expect(getMemcached().cache).toExcludeKey(repoCacheId);
            done();
          });
      });
    });

    context('when snap exists and is in memcached', () => {
      const urlPrefix = 'https://github.com/anowner/';

      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: true } });
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;
        const testSnap = {
          resource_type_link: `${lp_api_base}/#snap`,
          self_link: `${lp_api_base}${lp_snap_path}`,
          owner_link: `${lp_api_base}/~${lp_snap_user}`,
          git_repository_url: repositoryUrl
        };
        nock(lp_api_url)
          .delete(`/devel${lp_snap_path}`)
          .reply(200, 'null', { 'Content-Type': 'application/json' });
        setupInMemoryMemcached();
        const urlPrefixCacheId = getUrlPrefixCacheId(urlPrefix);
        const urlCacheId = getRepositoryUrlCacheId(repositoryUrl);
        getMemcached().cache[urlPrefixCacheId] = [testSnap];
        getMemcached().cache[urlCacheId] = testSnap;
      });

      afterEach(() => {
        resetMemcached();
        nock.cleanAll();
      });

      it('returns a 200 response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(200, done);
      });

      it('returns a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('returns body with a "snap-deleted" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('snap-deleted'))
          .end(done);
      });

      it('removes stale entries from memcached', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .end((err) => {
            if (err) {
              done(err);
            }
            const prefixCacheId = getUrlPrefixCacheId(urlPrefix);
            const repoCacheId = getRepositoryUrlCacheId(repositoryUrl);
            expect(getMemcached().cache).toExcludeKey(prefixCacheId);
            expect(getMemcached().cache).toExcludeKey(repoCacheId);
            done();
          });
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

      it('returns a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(401, done);
      });

      it('returns a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('returns a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('github-no-admin-permissions'))
          .end(done);
      });
    });

    context('when repo does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(404, { message: 'Not Found' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 Not Found response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-snapcraft-yaml-not-found" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('github-snapcraft-yaml-not-found'))
          .end(done);
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
            url: repositoryUrl
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
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(404, done);
      });

      it('returns an "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('returns body with a "snap-not-found" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
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
