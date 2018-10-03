import { createHmac } from 'crypto';
import Express from 'express';
import sortBy from 'lodash/sortBy';
import nock from 'nock';
import supertest from 'supertest';
import expect from 'expect';
import tmatch from 'tmatch';

import {
  getMemcached,
  resetMemcached,
  setupInMemoryMemcached
} from '../../../../../src/server/helpers/memcached';
import launchpad from '../../../../../src/server/routes/launchpad';
import db from '../../../../../src/server/db';
import {
  BUILD_TRIGGERED_BY_POLLER,
  BUILD_TRIGGERED_MANUALLY,
} from '../../../../../src/common/helpers/build_annotation';
import {
  getDefaultBranchCacheId,
  getSnapcraftYamlCacheId,
  listOrganizationsCacheId
} from '../../../../../src/server/handlers/github';
import {
  getUrlPrefixCacheId,
  getRepositoryUrlCacheId
} from '../../../../../src/server/handlers/launchpad';
import { conf } from '../../../../../src/server/helpers/config.js';

describe('The Launchpad API endpoint', () => {
  const app = Express();
  const session = { token: 'secret', user: { id: 123, login: 'anowner' }, 'csrfToken': 'blah' };
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "not-logged-in" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('not-logged-in'))
          .end(done);
      });
    });

    context('when user has admin permissions on repository', () => {
      const snapName = 'dummy-test-snap';

      beforeEach(async () => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: true } });
        await db.model('GitHubUser').query('truncate').fetch();
        await db.model('GitHubUser')
          .forge({
            github_id: session.user.id,
            login: session.user.login,
            last_login_at: new Date()
          })
          .save();
        await db.model('Repository').query('truncate').fetch();
      });

      afterEach(() => {
        nock.cleanAll();
      });

      context('when snap already exists', () => {

        beforeEach(() => {
          const lp_api_url = conf.get('LP_API_URL');
          nock(lp_api_url)
            .post('/devel/+snaps', (body) => tmatch(body, { ws: { op: 'new' } }))
            .reply(
              400,
              'There is already a snap package with the same name and owner.');
        });

        it('should return a 400 Bad Request response', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(400, done);
        });

        it('should return a "error" status', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasStatus('error'))
            .end(done);
        });

        it('should return a body with an "lp-error" message', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasMessage(
              'lp-error',
              'There is already a snap package with the same name and owner.'))
            .end(done);
        });

        it('should leave snaps_added unmodified', async () => {
          const dbUser = await db.model('GitHubUser')
            .where({ github_id: session.user.id })
            .fetch();
          await dbUser.save({ snaps_added: 1 });
          await supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          await dbUser.refresh();
          expect(dbUser.get('snaps_added')).toEqual(1);
        });
      });

      context('when snap does not exist', () => {
        let snapUrl;
        let lpApi;

        beforeEach(() => {
          const lp_api_url = conf.get('LP_API_URL');
          snapUrl = `${lp_api_url}/devel/~test-user/+snap/${snapName}`;
          lpApi = nock(lp_api_url);
          lpApi
            .post('/devel/+snaps', (body) => tmatch(body, {
              ws: { op: 'new' },
              git_repository_url: 'https://github.com/anowner/aname',
              auto_build: 'false',
              processors: [
                '/+processors/amd64',
                '/+processors/arm64',
                '/+processors/armhf',
                '/+processors/i386'
              ]
            }))
            .reply(201, 'Created', { Location: snapUrl });
          lpApi.get(`/devel/~test-user/+snap/${snapName}`)
            .reply(200, {
              resource_type_link: `${lp_api_url}/devel/#snap`,
              self_link: snapUrl,
              git_repository_url: 'https://github.com/anowner/aname',
              webhooks_collection_link: `${snapUrl}/webhooks`,
            });
          lpApi.get(`/devel/~test-user/+snap/${snapName}/webhooks`)
            .reply(200, { total_size: 0, entries: [] });
          const hmac = createHmac('sha1', conf.get('LP_WEBHOOK_SECRET'));
          hmac.update('anowner');
          hmac.update('aname');
          lpApi
            .post(`/devel/~test-user/+snap/${snapName}`, {
              ws: { op: 'newWebhook' },
              delivery_url: `${conf.get('BASE_URL')}/anowner/aname/` +
                            'webhook/notify',
              event_types: 'snap:build:0.1',
              active: 'true',
              secret: hmac.digest('hex')
            })
            .reply(201, 'Created', { Location: `${snapUrl}/+webhook/1` });
          lpApi.get(`/devel/~test-user/+snap/${snapName}/+webhook/1`)
            .reply(200, {
              resource_type_link: `${lp_api_url}/devel/#webhook`,
              self_link: `${snapUrl}/+webhook/1`
            });
          setupInMemoryMemcached();
        });

        afterEach(() => {
          lpApi.done();
          resetMemcached();
        });

        it('should return a 201 Created response', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(201, done);
        });

        it('should return a "success" status', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasStatus('success'))
            .end(done);
        });

        it('should return a body with the new snap URL', (done) => {
          supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect(hasMessage('snap-created', snapUrl))
            .end(done);
        });

        it('should leave snaps_added unmodified if it is unset', async () => {
          await supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          const dbUser = await db.model('GitHubUser')
            .where({ github_id: session.user.id })
            .fetch();
          expect(dbUser.get('snaps_added')).toBeFalsy();
        });

        it('should increment snaps_added if it is set', async () => {
          const dbUser = await db.model('GitHubUser')
            .where({ github_id: session.user.id })
            .fetch();
          await dbUser.save({ snaps_added: 1 });
          await supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          await dbUser.refresh();
          expect(dbUser.get('snaps_added')).toEqual(2);
        });

        it('should add row to Repository', async () => {
          await supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          const dbRepository = await db.model('Repository')
            .where({ owner: 'anowner', name: 'aname' })
            .fetch({ withRelated: ['registrant'] });
          expect(dbRepository.related('registrant').get('github_id'))
            .toEqual(session.user.id);
        });

        it('should clear appropriate url_prefix entry from ' +
           'memcached', async () => {
          const cacheId = getUrlPrefixCacheId('https://github.com/anowner/');
          getMemcached().cache[cacheId] = [];
          await supertest(app)
            .post('/launchpad/snaps')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          expect(getMemcached().cache).toExcludeKey(cacheId);
        });
      });
    });

    context('when repo URL cannot be parsed', () => {
      it('should return a 400 Bad Request response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'nonsense' })
          .expect(400, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'nonsense' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-bad-url" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
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

      it('should return a 403 Forbidden response', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(403, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-repository-not-found" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-repository-not-found'))
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-authentication-failed" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-authentication-failed'))
          .end(done);
      });
    });
  });

  describe('list snaps route', () => {
    let apiResponse;

    beforeEach(async () => {
      apiResponse = supertest(app)
        .get('/launchpad/snaps/list')
        .set('X-CSRF-Token', 'blah')
        .query({ owner: 'anowner' });
      await db.model('GitHubUser').query('truncate').fetch();
      await db.model('GitHubUser')
        .forge({
          github_id: session.user.id,
          login: session.user.login,
          last_login_at: new Date()
        })
        .save();
      await db.model('Repository').query('truncate').fetch();
    });

    context('when snaps exist', () => {
      const contents = {
        'https://github.com/anowner/test-snap': { name: 'snap1' },
        'https://github.com/org1/test-snap': { name: 'snap2' },
        'https://github.com/org1/invalid-snap': 'name: invalid-snap\n  invalid: test'
      };

      let testSnaps;

      let lpApi;
      let ghApi;

      beforeEach(async () => {
        const lp_api_url = conf.get('LP_API_URL');
        const gh_api_url = conf.get('GITHUB_API_ENDPOINT');
        const lp_api_base = `${lp_api_url}/devel`;

        testSnaps = [
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~another-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~another-user`,
            git_repository_url: 'https://github.com/anowner/test-snap',
            git_path: 'refs/heads/master',
            builds_collection_link: `${lp_api_base}/~another-user/+snap/` +
                                    'test-snap/builds',
            webhooks_collection_link: `${lp_api_base}/~another-user/+snap/` +
                                      'test-snap/webhooks',
            store_name: 'snap1'
          },
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~test-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~test-user`,
            git_repository_url: 'https://github.com/org1/test-snap',
            git_path: 'HEAD',
            builds_collection_link: `${lp_api_base}/~test-user/+snap/` +
                                    'test-snap/builds',
            webhooks_collection_link: `${lp_api_base}/~test-user/+snap/` +
                                      'test-snap/webhooks'
          },
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~test-user/+snap/invalid-snap`,
            owner_link: `${lp_api_base}/~test-user`,
            git_repository_url: 'https://github.com/org1/invalid-snap',
            git_path: 'HEAD',
            builds_collection_link: `${lp_api_base}/~test-user/+snap/` +
                                    'invalid-snap/builds',
            webhooks_collection_link: `${lp_api_base}/~test-user/+snap/` +
                                      'invalid-snap/webhooks'
          }
        ];

        ghApi = nock(gh_api_url);
        ghApi.get('/user/orgs')
          .reply(200, [{ login: 'org1' }, { login: 'org2' }]);

        lpApi = nock(lp_api_url);
        lpApi.get('/devel/+snaps')
          .query({
            'ws.op': 'findByURLPrefixes',
            url_prefixes: [
              'https://github.com/anowner/',
              'https://github.com/org1/',
              'https://github.com/org2/'
            ],
            owner: `/~${conf.get('LP_API_USERNAME')}`
          })
          .reply(200, {
            total_size: 2,
            start: 0,
            entries: testSnaps
          });

        testSnaps.map((snap) => {
          const fullName = snap.git_repository_url.replace('https://github.com/', '');
          const repoContents = contents[snap.git_repository_url];

          if (snap.git_path === 'HEAD') {
            ghApi.get(`/repos/${fullName}`)
              .reply(200, { default_branch: 'master' });
          }
          ghApi.get(`/repos/${fullName}/contents/snap/snapcraft.yaml`)
            .reply(200, repoContents);
          const builds_link = snap.builds_collection_link;
          lpApi.get(builds_link.replace(lp_api_url, ''))
            .optionally()
            .reply(200, {
              total_size: 2,
              entries: [
                {
                  resource_type_link: `${lp_api_url}/devel/#snap_build`,
                  self_link: `${builds_link.replace(/builds$/, '')}/+build/1`,
                  store_upload_status: 'Uploaded'
                },
                {
                  resource_type_link: `${lp_api_url}/devel/#snap_build`,
                  self_link: `${builds_link.replace(/builds$/, '')}/+build/2`
                }
              ]
            });
        });

        lpApi.get('/devel/~another-user/+snap/test-snap/webhooks')
          .reply(200, { total_size: 0, entries: [] });
        const hmac = createHmac('sha1', conf.get('LP_WEBHOOK_SECRET'));
        hmac.update('anowner');
        hmac.update('test-snap');
        lpApi
          .post('/devel/~another-user/+snap/test-snap', {
            ws: { op: 'newWebhook' },
            delivery_url: `${conf.get('BASE_URL')}/anowner/test-snap/` +
                          'webhook/notify',
            event_types: 'snap:build:0.1',
            active: 'true',
            secret: hmac.digest('hex')
          })
          .reply(201, 'Created', {
            Location: `${lp_api_url}/devel/~another-user/+snap/test-snap/` +
                      '+webhook/1'
          });
        lpApi.get('/devel/~another-user/+snap/test-snap/+webhook/1')
          .reply(200, {
            resource_type_link: `${lp_api_url}/devel/#webhook`,
            self_link: `${lp_api_url}/devel/~another-user/+snap/test-snap/` +
                       '+webhook/1'
          });
        lpApi.get('/devel/~test-user/+snap/test-snap/webhooks')
          .reply(200, {
            total_size: 1,
            entries: [
              {
                resource_type_link: `${lp_api_url}/devel/#webhook`,
                self_link: `${lp_api_url}/~test-user/+snap/test-snap/` +
                           '+webhook/1',
                delivery_url: `${conf.get('BASE_URL')}/org1/test-snap/` +
                              'webhook/notify',
              }
            ]
          });

        await db.model('Repository')
          .forge({ owner: 'anowner', name: 'test-snap' })
          .save();
      });

      afterEach(() => {
        lpApi.done();
        ghApi.done();
        nock.cleanAll();
      });

      it('should return a 200 response', async () => {
        await apiResponse.expect(200);
      });

      it('should return a "success" status', async () => {
        await apiResponse.expect(hasStatus('success'));
      });

      it('should return "snaps-found" code', async () => {
        await apiResponse.expect(hasBodyCode('snaps-found'));
      });

      it('should return result with snap ids', async () => {
        const response = await apiResponse;
        const responseSnaps = response.body.result;

        expect(responseSnaps.length).toEqual(testSnaps.length);
        expect(responseSnaps[0]).toEqual(testSnaps[0].git_repository_url);
        expect(responseSnaps[1]).toEqual(testSnaps[1].git_repository_url);
      });

      it('should return snaps with snapcraftData', async () => {
        const response = await apiResponse;
        const snap = response.body.entities.snaps[testSnaps[0].git_repository_url];

        expect(snap).toContain({
          snapcraftData: contents[snap.gitRepoUrl]
        });
        expect(snap).toContain({
          snapcraftData: { path: 'snap/snapcraft.yaml' }
        });
      });

      it('should return error in snapcraftData for invalid snapcraft.yaml', async () => {
        const response = await apiResponse;
        const snap = response.body.entities.snaps[testSnaps[2].git_repository_url];

        expect(snap.snapcraftData).toContain({
          error: { name: 'YAMLException' }
        });
      });

      it('should leave metrics unmodified if already set', async () => {
        const dbUser = await db.model('GitHubUser')
          .where({ github_id: session.user.id })
          .fetch();
        await dbUser.save({
          snaps_added: 4,
          snaps_removed: 2,
          names_registered: 2,
          builds_requested: 8,
          builds_released: 6
        });
        await apiResponse;
        await dbUser.refresh();
        expect(dbUser.serialize()).toMatch({
          snaps_added: 4,
          snaps_removed: 2,
          names_registered: 2,
          builds_requested: 8,
          builds_released: 6
        });
      });

      it('should initialize metrics if unset', async () => {
        await apiResponse;
        const dbUser = await db.model('GitHubUser')
          .where({ github_id: session.user.id })
          .fetch();
        expect(dbUser.serialize()).toMatch({
          snaps_added: 1,
          snaps_removed: 0,
          names_registered: 1,
          builds_requested: 2,
          builds_released: 1
        });
      });

      it('should update rows in Repository', async () => {
        await apiResponse;
        const dbRepositories = await db.model('Repository')
          .where('owner', 'in', ['anowner', 'org1'])
          .fetchAll();
        expect(sortBy(dbRepositories.serialize(), ['owner', 'name'])).toMatch([
          {
            owner: 'anowner',
            name: 'test-snap',
            snapcraft_name: 'snap1',
            store_name: 'snap1'
          },
          {
            owner: 'org1',
            name: 'invalid-snap',
            snapcraft_name: null,
            store_name: null
          },
          {
            owner: 'org1',
            name: 'test-snap',
            snapcraft_name: 'snap2',
            store_name: null
          },
        ]);
      });

      context('using memcached', () => {
        beforeEach(() => {
          setupInMemoryMemcached();
        });

        afterEach(() => {
          resetMemcached();
        });

        it('should store organizations in memcached', async () => {
          await apiResponse;
          const cacheId = listOrganizationsCacheId('anowner');
          const memcachedOrgs = getMemcached().cache[cacheId];
          expect(memcachedOrgs).toMatch([
            { login: 'org1' }, { login: 'org2' },
          ]);
        });

        it('should store snaps in memcached', async () => {
          const urlPrefixes = [
            'https://github.com/anowner/',
            'https://github.com/org1/',
            'https://github.com/org2/'
          ];
          const cacheIds = urlPrefixes.map(
            (urlPrefix) => getUrlPrefixCacheId(urlPrefix)
          );

          await apiResponse;
          const memcachedSnaps = cacheIds.map(
            (cacheId) => getMemcached().cache[cacheId]
          );
          expect(memcachedSnaps[0].length).toBe(1);
          expect(memcachedSnaps[0][0]).toContain(testSnaps[0]);
          expect(memcachedSnaps[1].length).toBe(2);
          expect(memcachedSnaps[1][0]).toContain(testSnaps[1]);
          expect(memcachedSnaps[1][1]).toContain(testSnaps[2]);
          expect(memcachedSnaps[2].length).toBe(0);
        });

      });

    });

    context('when snaps don\'t exist', () => {
      let lpApi;
      let ghApi;

      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const gh_api_url = conf.get('GITHUB_API_ENDPOINT');

        ghApi = nock(gh_api_url)
          .get('/user/orgs')
          .reply(200, [{ login: 'org1' }, { login: 'org2' }]);
        lpApi = nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURLPrefixes',
            url_prefixes: [
              'https://github.com/anowner/',
              'https://github.com/org1/',
              'https://github.com/org2/'
            ],
            owner: `/~${conf.get('LP_API_USERNAME')}`
          })
          .reply(200, {
            total_size: 2,
            start: 0,
            entries: []
          });
      });

      afterEach(() => {
        lpApi.done();
        ghApi.done();
        nock.cleanAll();
      });

      it('should return a 200 response', async () => {
        await apiResponse.expect(200);
      });

      it('should return a "success" status', async () => {
        await apiResponse.expect(hasStatus('success'));
      });

      it('should return "snaps-found" message with empty list', async () => {
        const response = await apiResponse;
        const responseSnaps = response.body.result;

        expect(responseSnaps.length).toEqual(0);
      });
    });

    context('when LP returns error', () => {
      let lpApi;
      let ghApi;

      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const gh_api_url = conf.get('GITHUB_API_ENDPOINT');

        ghApi = nock(gh_api_url)
          .get('/user/orgs')
          .reply(200, []);
        lpApi = nock(lp_api_url)
          .get('/devel/+snaps')
          .query({
            'ws.op': 'findByURLPrefixes',
            url_prefixes: 'https://github.com/anowner/',
            owner: `/~${conf.get('LP_API_USERNAME')}`
          })
          .reply(501, 'Something went quite wrong.');
      });

      afterEach(() => {
        lpApi.done();
        ghApi.done();
        nock.cleanAll();
      });

      it('should return an error response', async () => {
        await apiResponse.expect(501);
      });

      it('should return an "error" status', async () => {
        await apiResponse.expect(hasStatus('error'));
      });

      it('should return a body with an "lp-error" message', async() => {
        await apiResponse.expect(hasMessage('lp-error', 'Something went quite wrong.'));
      });
    });


    context('when snaps are memcached', () => {
      let testSnaps;
      let lpApi;

      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;

        testSnaps = [
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~another-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~another-user`,
            git_repository_url: 'https://github.com/anowner/test-snap',
            git_path: 'refs/heads/master',
            builds_collection_link: `${lp_api_base}/~another-user/+snap/` +
                                    'test-snap/builds',
            store_name: 'snap1'
          },
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~test-user/+snap/test-snap`,
            owner_link: `${lp_api_base}/~test-user`,
            git_repository_url: 'https://github.com/org1/test-snap',
            git_path: 'HEAD',
            builds_collection_link: `${lp_api_base}/~test-user/+snap/` +
                                    'test-snap/builds'
          }
        ];

        const contents = {
          'https://github.com/anowner/test-snap': { name: 'snap1' },
          'https://github.com/org1/test-snap': { name: 'snap2' }
        };

        setupInMemoryMemcached({
          [listOrganizationsCacheId('anowner')]: [
            { login: 'org1' }, { login: 'org2' }
          ],
          [getUrlPrefixCacheId('https://github.com/anowner/')]: [testSnaps[0]],
          [getUrlPrefixCacheId('https://github.com/org1/')]: [testSnaps[1]],
          [getUrlPrefixCacheId('https://github.com/org2/')]: []
        });

        lpApi = nock(lp_api_url);
        testSnaps.map((snap) => {
          if (snap.git_path === 'HEAD') {
            const defaultBranchCacheId = getDefaultBranchCacheId(
              snap.git_repository_url);
            getMemcached().cache[defaultBranchCacheId] = 'master';
          }
          const snapcraftYamlCacheId = getSnapcraftYamlCacheId(
            snap.git_repository_url);
          getMemcached().cache[snapcraftYamlCacheId] =
            contents[snap.git_repository_url];
          const builds_link = snap.builds_collection_link;
          lpApi.get(builds_link.replace(lp_api_url, ''))
            .optionally()
            .reply(200, {
              total_size: 2,
              entries: [
                {
                  resource_type_link: `${lp_api_url}/devel/#snap_build`,
                  self_link: `${builds_link.replace(/builds$/, '')}/+build/1`,
                  store_upload_status: 'Uploaded'
                },
                {
                  resource_type_link: `${lp_api_url}/devel/#snap_build`,
                  self_link: `${builds_link.replace(/builds$/, '')}/+build/2`
                }
              ]
            });
        });
      });

      afterEach(() => {
        lpApi.done();
        nock.cleanAll();
        resetMemcached();
      });

      it('should return a 200 response', async () => {
        await apiResponse.expect(200);
      });

      it('should return a "success" status', async () => {
        await apiResponse.expect(hasStatus('success'));
      });

      it('should return "snaps-found" code', async () => {
        await apiResponse.expect(hasBodyCode('snaps-found'));
      });

      it('should return snaps code', async () => {
        const response = await apiResponse;
        const responseSnaps = response.body.result;

        expect(responseSnaps.length).toEqual(testSnaps.length);
        expect(responseSnaps[0]).toEqual(testSnaps[0].git_repository_url);
        expect(responseSnaps[1]).toEqual(testSnaps[1].git_repository_url);
      });

      it('should leave metrics unmodified if already set', async () => {
        const dbUser = await db.model('GitHubUser')
          .where({ github_id: session.user.id })
          .fetch();
        await dbUser.save({
          snaps_added: 4,
          snaps_removed: 2,
          names_registered: 2,
          builds_requested: 8,
          builds_released: 6
        });
        await apiResponse;
        await dbUser.refresh();
        expect(dbUser.serialize()).toMatch({
          snaps_added: 4,
          snaps_removed: 2,
          names_registered: 2,
          builds_requested: 8,
          builds_released: 6
        });
      });

      it('should initialize metrics if unset', async () => {
        await apiResponse;
        const dbUser = await db.model('GitHubUser')
          .where({ github_id: session.user.id })
          .fetch();
        expect(dbUser.serialize()).toMatch({
          snaps_added: 1,
          snaps_removed: 0,
          names_registered: 1,
          builds_requested: 2,
          builds_released: 1
        });
      });

    });

  });

  describe('find snap route', () => {

    context('when snap exists', () => {
      let testSnaps;
      let snapcraftData;
      let lpApi;
      let ghApi;

      beforeEach(() => {
        const lp_api_url = conf.get('LP_API_URL');
        const lp_api_base = `${lp_api_url}/devel`;
        const gh_api_url = conf.get('GITHUB_API_ENDPOINT');

        testSnaps = [
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~another-user/+snap/test-snap`,
            git_repository_url: 'https://github.com/anowner/aname',
            git_path: 'refs/heads/master',
            owner_link: `${lp_api_base}/~another-user`
          },
          {
            resource_type_link: `${lp_api_base}/#snap`,
            self_link: `${lp_api_base}/~test-user/+snap/test-snap`,
            git_repository_url: 'https://github.com/anowner/aname',
            git_path: 'HEAD',
            owner_link: `${lp_api_base}/~test-user`
          }
        ];

        snapcraftData = { name: 'name', confinement: 'test' };

        lpApi = nock(lp_api_url)
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

        ghApi = nock(gh_api_url);
        ghApi
          .get('/repos/anowner/aname')
          .reply(200, { default_branch: 'dev' });
        ghApi
          .get('/repos/anowner/aname/contents/snap/snapcraft.yaml')
          .reply(200, snapcraftData);
      });

      afterEach(() => {
        lpApi.done();
        ghApi.done();
        nock.cleanAll();
      });

      it('should return a 200 response', async () => {
        await supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(200);
      });

      it('should return a "success" status', async () => {
        await supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('success'));
      });

      it('should return a body with a "snap-found" message with the normalized snap', async () => {
        const res = await supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' });

        expect(res.body.code).toEqual('snap-found');

        expect(res.body.entities.snaps[res.body.result]).toContain({
          gitRepoUrl: testSnaps[1].git_repository_url,
          gitBranch: 'dev',
          selfLink: testSnaps[1].self_link,
          snapcraftData: snapcraftData
        });
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
        self_link: `${conf.get('LP_API_URL')}/devel/~test-user/+snap/test-snap`,
        git_repository_url: repositoryUrl,
        git_path: 'HEAD'
      };
      let snapcraftData = { name: 'name', confinement: 'test' };

      before(() => {
        setupInMemoryMemcached();
        getMemcached().cache[getRepositoryUrlCacheId(repositoryUrl)] = snap;
        getMemcached().cache[getDefaultBranchCacheId(repositoryUrl)] = 'dev';
        getMemcached().cache[getSnapcraftYamlCacheId(repositoryUrl)] = snapcraftData;
      });

      after(() => {
        resetMemcached();
      });

      it('should return a 200 response', async () => {
        await supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(200);
      });

      it('should return a "success" status', async () => {
        await supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('success'));
      });

      it('should return a body with a "snap-found" message with the correct snap', async () => {
        const res = await supertest(app)
          .get('/launchpad/snaps')
          .query({ repository_url: 'https://github.com/anowner/aname' });

        expect(res.body.code).toEqual('snap-found');

        expect(res.body.entities.snaps[res.body.result]).toContain({
          gitRepoUrl: snap.git_repository_url,
          gitBranch: 'dev',
          selfLink: snap.self_link,
          snapcraftData: snapcraftData
        });
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
            expect(res.statusCode).toEqual(403);
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

        beforeEach(async () => {
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
          await db.model('GitHubUser').query('truncate').fetch();
          await db.model('GitHubUser')
            .forge({
              github_id: session.user.id,
              login: session.user.login,
              last_login_at: new Date()
            })
            .save();
          await db.model('Repository').query('truncate').fetch();
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

          it('leaves names_registered unmodified if it is unset', async () => {
            await supertest(app)
              .post('/launchpad/snaps/authorize')
              .send({
                repository_url: 'https://github.com/anowner/aname',
                snap_name: snapName,
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-macaroon'
              });
            const dbUser = await db.model('GitHubUser')
              .where({ github_id: session.user.id })
              .fetch();
            expect(dbUser.get('names_registered')).toBeFalsy();
          });

          it('increments names_registered if it is set', async () => {
            const dbUser = await db.model('GitHubUser')
              .where({ github_id: session.user.id })
              .fetch();
            await dbUser.save({ names_registered: 1 });
            await supertest(app)
              .post('/launchpad/snaps/authorize')
              .send({
                repository_url: 'https://github.com/anowner/aname',
                snap_name: snapName,
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-macaroon'
              });
            await dbUser.refresh();
            expect(dbUser.get('names_registered')).toEqual(2);
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
                ws: { op: 'completeAuthorization' },
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

          it('leaves names_registered unmodified if it is unset', async () => {
            await supertest(app)
              .post('/launchpad/snaps/authorize')
              .send({
                repository_url: 'https://github.com/anowner/aname',
                snap_name: snapName,
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-macaroon'
              });
            const dbUser = await db.model('GitHubUser')
              .where({ github_id: session.user.id })
              .fetch();
            expect(dbUser.get('names_registered')).toBeFalsy();
          });

          it('increments names_registered if it is set', async () => {
            const dbUser = await db.model('GitHubUser')
              .where({ github_id: session.user.id })
              .fetch();
            await dbUser.save({ names_registered: 1 });
            await supertest(app)
              .post('/launchpad/snaps/authorize')
              .send({
                repository_url: 'https://github.com/anowner/aname',
                snap_name: snapName,
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-macaroon'
              });
            await dbUser.refresh();
            expect(dbUser.get('names_registered')).toEqual(2);
          });

          it('updates rows in Repository', async () => {
            const dbRepository = await db.model('Repository')
              .forge({ owner: 'anowner', name: 'aname' })
              .save();
            await supertest(app)
              .post('/launchpad/snaps/authorize')
              .send({
                repository_url: 'https://github.com/anowner/aname',
                snap_name: snapName,
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-macaroon'
              });
            await dbRepository.refresh();
            expect(dbRepository.get('store_name')).toEqual(snapName);
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
    let lp_pending_build_requests_path;
    let lp_builds_path;
    let lp_pending_builds_path;
    let lp_completed_builds_path;
    let lp_snap_url;

    before(() => {
      lp_api_url = conf.get('LP_API_URL');
      lp_snap_path = `/devel/~${lp_snap_user}/+snap/${lp_snap_name}`;
      lp_pending_build_requests_path =
        `${lp_snap_path}/pending_build_requests`;
      lp_builds_path = `${lp_snap_path}/builds`;
      lp_pending_builds_path = `${lp_snap_path}/pending_builds`;
      lp_completed_builds_path = `${lp_snap_path}/completed_builds`;

      lp_snap_url = `${lp_api_url}${lp_snap_path}`;
    });

    context('when snap and builds are successfully fetched', () => {
      let test_build_request;
      let test_build;

      beforeEach(async () => {
        await db.model('BuildRequestAnnotation').query().truncate();
        await db.model('BuildAnnotation').query().truncate();

        test_build_request = {
          resource_type_link: `${lp_api_url}/devel/#snap_build_request`,
          self_link: `${lp_api_url}${lp_snap_path}/+build-request/123`
        };
        test_build = {
          resource_type_link: `${lp_api_url}/devel/#snap_build`,
          self_link: `${lp_api_url}${lp_snap_path}/+build/12345`
        };

        // Corresponding build_annotation.
        await db.model('BuildAnnotation')
          .forge({ build_id: 12345, reason: 'Testing ...' })
          .save({}, { method: 'insert' });

        // when getting snap data from API (via self_link)
        nock(lp_api_url)
          .get(lp_snap_path)
          .reply(200, {
            name: lp_snap_name,
            pending_build_requests_collection_link:
              `${lp_api_url}${lp_pending_build_requests_path}`,
            builds_collection_link: `${lp_api_url}${lp_builds_path}`,
            pending_builds_collection_link:  `${lp_api_url}${lp_pending_builds_path}`,
            completed_builds_collection_link:  `${lp_api_url}${lp_completed_builds_path}`
          });

        // when getting build requests list (via
        // pending_build_requests_collection_link)
        nock(lp_api_url)
          .get(lp_pending_build_requests_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(200, {
            total_size: 1,
            start: 0,
            entries: [ test_build_request ]
          });

        // when getting builds list (via pending_builds_collection_link)
        nock(lp_api_url)
          .get(lp_pending_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 9
          })
          .reply(200, {
            total_size: 9,
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
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return body with "snap-builds-found" message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(hasMessage('snap-builds-found'))
          .end(done);
      });

      it('should return builds and build requests list in payload', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .end((err, res) => {
            expect(res.body.payload.builds).toEqual(
              [test_build_request, test_build]
            );
            done(err);
          });
      });

      it('should return build annotations in payload', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .end((err, res) => {
            expect(res.body.payload.build_annotations).toEqual({
              12345: { reason: 'Testing ...' }
            });
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
            pending_build_requests_collection_link:
              `${lp_api_url}${lp_pending_build_requests_path}`,
            builds_collection_link: `${lp_api_url}${lp_builds_path}`,
            pending_builds_collection_link:  `${lp_api_url}${lp_pending_builds_path}`,
            completed_builds_collection_link:  `${lp_api_url}${lp_completed_builds_path}`
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should default start to 0 and size to 10', (done) => {
        const lp = nock(lp_api_url);

        // when getting build requests list (via
        // pending_build_requests_collection_link)
        lp.get(lp_pending_build_requests_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(200, { total_size: 0, entries: [] });

        // when getting builds list (via pending_builds_collection_link)
        lp.get(lp_pending_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(200, { total_size: 10, entries: [] });

        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(200, (err) => {
            lp.done();
            done(err);
          });
      });

      it('should fetch pending build requests, then pending builds, and ' +
         'then completed builds', (done) => {
        const lp = nock(lp_api_url)
          .get(lp_pending_build_requests_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(200, { total_size: 1, entries: [] })
          .get(lp_pending_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 9
          })
          .reply(200, { total_size: 5, entries: [] })
          .get(lp_completed_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 4
          })
          .reply(200, { total_size: 4, entries: [] });

        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(200, (err) => {
            lp.done();
            done(err);
          });
      });

      it('should pass start and size params to builds collection ' +
         'calls', (done) => {
        const lp = nock(lp_api_url)
          .get(lp_pending_build_requests_path)
          .query({
            'ws.start': 7,
            'ws.size': 42
          })
          .reply(200, { total_size: 0, entries: [] })
          .get(lp_pending_builds_path)
          .query({
            'ws.start': 7,
            'ws.size': 42
          })
          .reply(200, { total_size: 0, entries: [] })
          .get(lp_completed_builds_path)
          .query({
            'ws.start': 7,
            'ws.size': 42
          })
          .reply(200, { total_size: 0, entries: [] });

        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
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
            pending_build_requests_collection_link:
              `${lp_api_url}${lp_pending_build_requests_path}`,
            builds_collection_link: `${lp_api_url}${lp_builds_path}`,
            pending_builds_collection_link:  `${lp_api_url}${lp_pending_builds_path}`,
            completed_builds_collection_link:  `${lp_api_url}${lp_completed_builds_path}`
          });

        // when getting build requests list (via
        // pending_build_requests_collection_link)
        nock(lp_api_url)
          .get(lp_pending_build_requests_path)
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
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return body with error message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
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
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return body with error message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(hasMessage('lp-error', 'Not found'))
          .end(done);
      });

    });

    context('when snap parameter is missing', () => {

      it('should return a 404 response', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return body with error message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .expect(hasMessage('missing-snap-link'))
          .end(done);
      });

    });

    context('when builds have an associated build request', () => {
      let test_build_request;
      let test_builds;

      beforeEach(async () => {
        await db.model('BuildRequestAnnotation').query().truncate();
        await db.model('BuildAnnotation').query().truncate();

        test_build_request = {
          resource_type_link: `${lp_api_url}/devel/#snap_build_request`,
          self_link: `${lp_api_url}${lp_snap_path}/+build-request/123`
        };
        test_builds = [
          {
            resource_type_link: `${lp_api_url}/devel/#snap_build`,
            self_link: `${lp_api_url}${lp_snap_path}/+build/12345`
          },
          {
            resource_type_link: `${lp_api_url}/devel/#snap_build`,
            self_link: `${lp_api_url}${lp_snap_path}/+build/12346`
          },
          {
            resource_type_link: `${lp_api_url}/devel/#snap_build`,
            self_link: `${lp_api_url}${lp_snap_path}/+build/12347`
          }
        ];

        await db.model('BuildRequestAnnotation')
          .forge({ request_id: 123, reason: 'Testing request' })
          .save({}, { method: 'insert' });
        await db.model('BuildAnnotation')
          .forge({ build_id: 12345, request_id: 123 })
          .save({}, { method: 'insert' });
        await db.model('BuildAnnotation')
          .forge({ build_id: 12346, request_id: 123, reason: 'Testing build' })
          .save({}, { method: 'insert' });

        nock(lp_api_url)
          .get(lp_snap_path)
          .reply(200, {
            name: lp_snap_name,
            pending_build_requests_collection_link:
              `${lp_api_url}${lp_pending_build_requests_path}`,
            builds_collection_link: `${lp_api_url}${lp_builds_path}`,
            pending_builds_collection_link:
              `${lp_api_url}${lp_pending_builds_path}`,
            completed_builds_collection_link:
              `${lp_api_url}${lp_completed_builds_path}`
          });

        nock(lp_api_url)
          .get(lp_pending_build_requests_path)
          .query({
            'ws.start': 0,
            'ws.size': 10
          })
          .reply(200, {
            total_size: 1,
            start: 0,
            entries: [ test_build_request ]
          });

        nock(lp_api_url)
          .get(lp_pending_builds_path)
          .query({
            'ws.start': 0,
            'ws.size': 9
          })
          .reply(200, {
            total_size: 9,
            start: 0,
            entries: test_builds
          });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 200 OK response', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return body with "snap-builds-found" message', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .expect(hasMessage('snap-builds-found'))
          .end(done);
      });

      it('should return builds and build requests list in payload', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .end((err, res) => {
            expect(res.body.payload.builds).toEqual(
              [test_build_request, ...test_builds]
            );
            done(err);
          });
      });

      it('should return build and build request annotations in ' +
         'payload', (done) => {
        supertest(app)
          .get('/launchpad/builds')
          .set('X-CSRF-Token', 'blah')
          .query({ snap: lp_snap_url })
          .end((err, res) => {
            expect(res.body.payload.build_request_annotations).toEqual({
              123: { reason: 'Testing request' }
            });
            expect(res.body.payload.build_annotations).toEqual({
              12345: { reason: 'Testing request' },
              12346: { reason: 'Testing build' }
            });
            done(err);
          });
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
      beforeEach(async () => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .get('/repos/anowner/aname')
          .reply(200, { permissions: { admin: true } });
        api = nock(lp_api_url);
        api.post(`/devel${lp_snap_path}`, {
          ws: { op: 'requestAutoBuilds' }
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
        await db.model('GitHubUser').query('truncate').fetch();
        await db.model('GitHubUser')
          .forge({
            github_id: session.user.id,
            login: session.user.login,
            last_login_at: new Date()
          })
          .save();
        await db.model('Repository').query('truncate').fetch();
        await db.model('BuildAnnotation').query().truncate();
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
            .set('X-CSRF-Token', 'blah')
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
            .set('X-CSRF-Token', 'blah')
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
            .set('X-CSRF-Token', 'blah')
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
            .set('X-CSRF-Token', 'blah')
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

        it('records default build annotation', async () => {
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({
              repository_url: 'https://github.com/anowner/aname',
            });
          const build_annotations = await db.model('BuildAnnotation').fetchAll();
          let reasons = {};
          for (const m of build_annotations.models) {
            reasons[m.get('build_id')] = m.get('reason');
          }
          expect(reasons).toEqual({
            1: BUILD_TRIGGERED_MANUALLY,
            2: BUILD_TRIGGERED_MANUALLY
          });
        });

        it('records custom build annotation', async () => {
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({
              repository_url: 'https://github.com/anowner/aname',
              reason: BUILD_TRIGGERED_BY_POLLER
            });
          const build_annotations = await db.model('BuildAnnotation').fetchAll();
          let reasons = {};
          for (const m of build_annotations.models) {
            reasons[m.get('build_id')] = m.get('reason');
          }
          expect(reasons).toEqual({
            1: BUILD_TRIGGERED_BY_POLLER,
            2: BUILD_TRIGGERED_BY_POLLER
          });
        });

        it('returns just created build annotations in payload', (done) => {
          supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' })
            .expect((res) => {
              expect(res.body.payload.build_request_annotations).toEqual({});
              expect(res.body.payload.build_annotations).toEqual({
                1: { reason: BUILD_TRIGGERED_MANUALLY },
                2: { reason: BUILD_TRIGGERED_MANUALLY }
              });
            })
            .end((err) => {
              api.done();
              done(err);
            });
        });

        it('leaves builds_requested unmodified if it is unset', async () => {
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          expect(dbUser.get('builds_requested')).toBeFalsy();
        });

        it('increments builds_requested if it is set', async () => {
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          await dbUser.save({ builds_requested: 2 });
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          await dbUser.refresh();
          expect(dbUser.get('builds_requested')).toEqual(4);
        });

        it('attributes builds_requested to the registrant', async () => {
          const dbUser = await db.model('GitHubUser')
            .forge({
              github_id: session.user.id + 1,
              login: 'another',
              last_login_at: new Date(),
              builds_requested: 2
            })
            .save();
          await db.model('Repository')
            .forge({
              owner: 'anowner',
              name: 'aname',
              registrant_id: dbUser.get('id')
            })
            .save();
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          await dbUser.refresh();
          expect(dbUser.get('builds_requested')).toEqual(4);
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
            .set('X-CSRF-Token', 'blah')
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
            .set('X-CSRF-Token', 'blah')
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
            .set('X-CSRF-Token', 'blah')
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
            .set('X-CSRF-Token', 'blah')
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

        it('leaves builds_requested unmodified if it is unset', async () => {
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          expect(dbUser.get('builds_requested')).toBeFalsy();
        });

        it('increments builds_requested if it is set', async () => {
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          await dbUser.save({ builds_requested: 2 });
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          await dbUser.refresh();
          expect(dbUser.get('builds_requested')).toEqual(4);
        });

        it('attributes builds_requested to the registrant', async () => {
          const dbUser = await db.model('GitHubUser')
            .forge({
              github_id: session.user.id + 1,
              login: 'another',
              last_login_at: new Date(),
              builds_requested: 2
            })
            .save();
          await db.model('Repository')
            .forge({
              owner: 'anowner',
              name: 'aname',
              registrant_id: dbUser.get('id')
            })
            .save();
          await supertest(app)
            .post('/launchpad/snaps/request-builds')
            .set('X-CSRF-Token', 'blah')
            .send({ repository_url: 'https://github.com/anowner/aname' });
          await dbUser.refresh();
          expect(dbUser.get('builds_requested')).toEqual(4);
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

      it('should return a 403 Forbidden response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(403, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .set('X-CSRF-Token', 'blah')
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-repository-not-found" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasMessage('github-repository-not-found'))
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(404, done);
      });

      it('returns an "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: 'https://github.com/anowner/aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('returns body with a "snap-not-found" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/request-builds')
          .set('X-CSRF-Token', 'blah')
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

    beforeEach(async () => {
      setupInMemoryMemcached();
      await db.model('GitHubUser').query('truncate').fetch();
      await db.model('GitHubUser')
        .forge({
          github_id: session.user.id,
          login: session.user.login,
          last_login_at: new Date()
        })
        .save();
      await db.model('Repository').query('truncate').fetch();
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(200, done);
      });

      it('returns a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('returns body with a "snap-deleted" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('snap-deleted'))
          .end(done);
      });

      it('removes stale entries from memcached', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
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

      it('leaves snaps_removed unmodified if it is unset', async () => {
        await supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl });
        const dbUser = await db.model('GitHubUser')
          .where({ github_id: session.user.id })
          .fetch();
        expect(dbUser.get('snaps_removed')).toBeFalsy();
      });

      it('increments snaps_removed if it is set', async () => {
        const dbUser = await db.model('GitHubUser')
          .where({ github_id: session.user.id })
          .fetch();
        await dbUser.save({ snaps_removed: 1 });
        await supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl });
        await dbUser.refresh();
        expect(dbUser.get('snaps_removed')).toEqual(2);
      });

      it('deletes rows from Repository', async () => {
        await db.model('Repository')
          .forge({ owner: 'anowner', name: 'aname' })
          .save();
        await supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl });
        const dbRepository = await db.model('Repository')
          .where({ owner: 'anowner', name: 'aname' })
          .fetch();
        expect(dbRepository).toBe(null);
      });

      it('returns a 401 unauthorized response when X-CSRF-Token header not sent', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .send({ repository_url: repositoryUrl })
          .expect(401, done);
      });

      it('returns a 401 unauthorized response when unrecognised X-CSRF-Token header sent', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'foo')
          .send({ repository_url: repositoryUrl })
          .expect(401, done);
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(200, done);
      });

      it('returns a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('returns body with a "snap-deleted" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('snap-deleted'))
          .end(done);
      });

      it('removes stale entries from memcached', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
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

      it('returns a 403 Forbidden response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(403, done);
      });

      it('returns a "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('returns a body with a "github-no-admin-permissions" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
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
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 200 response', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a body with a "snap-deleted" ' +
         'message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('snap-deleted'))
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
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(404, done);
      });

      it('returns an "error" status', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('returns body with a "snap-not-found" message', (done) => {
        supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl })
          .expect(hasMessage('snap-not-found'))
          .end(done);
      });

      it('leaves snaps_removed unmodified', async () => {
        const dbUser = await db.model('GitHubUser')
          .where({ github_id: session.user.id })
          .fetch();
        await dbUser.save({ snaps_removed: 1 });
        await supertest(app)
          .post('/launchpad/snaps/delete')
          .set('X-CSRF-Token', 'blah')
          .send({ repository_url: repositoryUrl });
        await dbUser.refresh();
        expect(dbUser.get('snaps_removed')).toEqual(1);
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

const hasBodyCode = (code) => {
  return (actual) => {
    if (typeof actual.body === 'undefined'
        || typeof actual.body.code === 'undefined'
        || actual.body.code !== code) {
      throw new Error('Response does not have code ' + code);
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
