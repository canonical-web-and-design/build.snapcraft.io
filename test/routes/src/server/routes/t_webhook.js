import { createHmac } from 'crypto';
import expect from 'expect';
import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';

import db from '../../../../../src/server/db';
import { getSnapcraftYamlCacheId } from '../../../../../src/server/handlers/github';
import { conf } from '../../../../../src/server/helpers/config';
import {
  getMemcached,
  resetMemcached,
  setupInMemoryMemcached
} from '../../../../../src/server/helpers/memcached';
import github from '../../../../../src/server/routes/webhook';

describe('The WebHook API endpoint', () => {
  let app;
  app = Express();
  app.use(github);

  beforeEach(async () => {
    await db.model('BuildAnnotation').query().truncate();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('notify route', () => {
    const lp_snap_user = 'test-user';
    const lp_snap_path = `/~${lp_snap_user}/+snap/test-snap`;

    it('rejects unsigned requests', (done) => {
      supertest(app)
        .post('/anowner/aname/webhook/notify')
        .send({})
        .expect(400, done);
    });

    it('rejects requests containing non-object JSON data', (done) => {
      supertest(app)
        .post('/anowner/aname/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature', 'dummy')
        .send('"bad"')
        .expect(400, done);
    });

    it('rejects requests containing malformed JSON data', (done) => {
      supertest(app)
        .post('/anowner/aname/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature', 'dummy')
        .send('{"bad"')
        .expect(400, done);
    });

    it('rejects requests with a bad signature', (done) => {
      const body = JSON.stringify({ ref: 'refs/heads/master' });
      let hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
      hmac.update('anowner');
      hmac.update('aname');
      hmac = createHmac('sha1', hmac.digest('hex'));
      hmac.update(body + ' ');
      supertest(app)
        .post('/anowner/aname/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature', `sha1=${hmac.digest('hex')}`)
        .send(body)
        .expect(400, done);
    });

    describe('with a good signature from GitHub', () => {
      const lp_api_url = conf.get('LP_API_URL');
      const lp_api_base = `${lp_api_url}/devel`;
      const body = JSON.stringify({ ref: 'refs/heads/master' });
      let signature;

      before(() => {
        let hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
        hmac.update('anowner');
        hmac.update('aname');
        hmac = createHmac('sha1', hmac.digest('hex'));
        hmac.update(body);
        signature = hmac.digest('hex');
      });

      beforeEach(() => {
        setupInMemoryMemcached();
      });

      afterEach(() => {
        resetMemcached();
      });

      describe('if name is not registered', () => {
        let findByURL;

        beforeEach(() => {
          findByURL = nock(lp_api_url)
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
                  self_link: `${lp_api_base}${lp_snap_path}`,
                  owner_link: `${lp_api_base}/~${lp_snap_user}`,
                  store_name: null
                }
              ]
            });
        });

        it('returns 500', (done) => {
          supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-GitHub-Event', 'push')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body)
            .expect(500, (err) => {
              findByURL.done();
              done(err);
            });
        });
      });

      describe('if name is registered and auto_build is true', () => {
        let findByURL;
        let requestAutoBuilds;

        beforeEach(() => {
          findByURL = nock(lp_api_url)
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
                  self_link: `${lp_api_base}${lp_snap_path}`,
                  owner_link: `${lp_api_base}/~${lp_snap_user}`,
                  store_name: 'test-snap',
                  auto_build: true
                }
              ]
            });
          requestAutoBuilds = nock(lp_api_url)
            .post(`/devel${lp_snap_path}`, { ws: { op: 'requestAutoBuilds' } })
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

        it('returns 200 OK and requests builds', (done) => {
          supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-GitHub-Event', 'push')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body)
            .expect(200, (err) => {
              findByURL.done();
              requestAutoBuilds.done();
              done(err);
            });
        });

        it('clears snap name from memcached', (done) => {
          const cacheId = getSnapcraftYamlCacheId(
            'https://github.com/anowner/aname'
          );
          getMemcached().cache[cacheId] = 'snap1';
          supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-GitHub-Event', 'push')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body)
            .expect(200, (err) => {
              expect(getMemcached().cache).toExcludeKey(cacheId);
              done(err);
            });
        });
      });

      describe('if name is registered and auto_build is false', () => {
        let findByURL;

        beforeEach(() => {
          findByURL = nock(lp_api_url)
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
                  self_link: `${lp_api_base}${lp_snap_path}`,
                  owner_link: `${lp_api_base}/~${lp_snap_user}`,
                  store_name: 'test-snap',
                  auto_build: false
                }
              ]
            });
        });

        describe('if snapcraft.yaml is missing', () => {
          let getSnapcraftYaml;

          beforeEach(() => {
            const contentsPath = '/repos/anowner/aname/contents';
            const query = {
              client_id: conf.get('GITHUB_AUTH_CLIENT_ID'),
              client_secret: conf.get('GITHUB_AUTH_CLIENT_SECRET')
            };
            const error = { message: 'Not Found' };

            getSnapcraftYaml = nock(conf.get('GITHUB_API_ENDPOINT'))
              .get(`${contentsPath}/snap/snapcraft.yaml`)
              .query(query)
              .reply(404, error)
              .get(`${contentsPath}/snapcraft.yaml`)
              .query(query)
              .reply(404, error)
              .get(`${contentsPath}/.snapcraft.yaml`)
              .query(query)
              .reply(404, error);
          });

          it('returns 500', (done) => {
            supertest(app)
              .post('/anowner/aname/webhook/notify')
              .type('application/json')
              .set('X-GitHub-Event', 'push')
              .set('X-Hub-Signature', `sha1=${signature}`)
              .send(body)
              .expect(500, (err) => {
                findByURL.done();
                getSnapcraftYaml.done();
                done(err);
              });
          });

          it('clears snap name from memcached', (done) => {
            const cacheId = getSnapcraftYamlCacheId(
              'https://github.com/anowner/aname'
            );
            getMemcached().cache[cacheId] = 'snap1';
            supertest(app)
              .post('/anowner/aname/webhook/notify')
              .type('application/json')
              .set('X-GitHub-Event', 'push')
              .set('X-Hub-Signature', `sha1=${signature}`)
              .send(body)
              .expect(500, (err) => {
                expect(getMemcached().cache).toExcludeKey(cacheId);
                done(err);
              });
          });
        });

        describe('if snapcraft.yaml is present', () => {
          let getSnapcraftYaml;
          let patchSnapAutoBuild;
          let requestAutoBuilds;

          beforeEach(() => {
            getSnapcraftYaml = nock(conf.get('GITHUB_API_ENDPOINT'))
              .get('/repos/anowner/aname/contents/snap/snapcraft.yaml')
              .query({
                client_id: conf.get('GITHUB_AUTH_CLIENT_ID'),
                client_secret: conf.get('GITHUB_AUTH_CLIENT_SECRET')
              })
              .reply(200, 'name: dummy-test-snap\n');
            patchSnapAutoBuild = nock(lp_api_url)
              .post(`/devel${lp_snap_path}`, { auto_build: true })
              .reply(200, {
                resource_type_link: `${lp_api_base}/#snap`,
                self_link: `${lp_api_base}${lp_snap_path}`,
                auto_build: true
              });
            requestAutoBuilds = nock(lp_api_url)
              .post(`/devel${lp_snap_path}`, { ws: { op: 'requestAutoBuilds' } })
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

          it('returns 200 OK and requests builds', (done) => {
            supertest(app)
              .post('/anowner/aname/webhook/notify')
              .type('application/json')
              .set('X-GitHub-Event', 'push')
              .set('X-Hub-Signature', `sha1=${signature}`)
              .send(body)
              .expect(200, (err) => {
                findByURL.done();
                getSnapcraftYaml.done();
                patchSnapAutoBuild.done();
                requestAutoBuilds.done();
                done(err);
              });
          });

          // XXX cjwatson 2017-02-16: The code under test should cache the
          // returned snap name instead, but this will do for now.
          it('clears snap name from memcached', (done) => {
            const cacheId = getSnapcraftYamlCacheId(
              'https://github.com/anowner/aname'
            );
            getMemcached().cache[cacheId] = 'snap1';
            supertest(app)
              .post('/anowner/aname/webhook/notify')
              .type('application/json')
              .set('X-GitHub-Event', 'push')
              .set('X-Hub-Signature', `sha1=${signature}`)
              .send(body)
              .expect(200, (err) => {
                expect(getMemcached().cache).toExcludeKey(cacheId);
                done(err);
              });
          });
        });
      });

      it('returns 500 if it fails to request builds', (done) => {
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

        supertest(app)
          .post('/anowner/aname/webhook/notify')
          .type('application/json')
          .set('X-GitHub-Event', 'push')
          .set('X-Hub-Signature', `sha1=${signature}`)
          .send(body)
          .expect(500, done);
      });

      it('returns 200 but does not request builds for a ping ' +
         'event', (done) => {
        const findByURL = nock(lp_api_url)
          .get('/devel/+snaps')
          .reply(500);
        const requestAutoBuilds = nock(lp_api_url)
          .post(`/devel${lp_snap_path}`)
          .reply(500);

        supertest(app)
          .post('/anowner/aname/webhook/notify')
          .type('application/json')
          .set('X-GitHub-Event', 'ping')
          .set('X-Hub-Signature', `sha1=${signature}`)
          .send(body)
          .expect(200, (err) => {
            expect(findByURL.isDone()).toBe(false);
            expect(requestAutoBuilds.isDone()).toBe(false);
            done(err);
          });
      });
    });

    describe('with a good signature from Launchpad', () => {
      beforeEach(async () => {
        await db.model('GitHubUser').query('truncate').fetch();
        await db.model('GitHubUser')
          .forge({
            github_id: 1,
            login: 'anowner',
            last_login_at: new Date()
          })
          .save();
        await db.model('Repository').query('truncate').fetch();
      });

      context('if store_upload_status is not Uploaded', () => {
        const body = JSON.stringify({ store_upload_status: 'Pending' });
        let signature;

        before(() => {
          let hmac = createHmac('sha1', conf.get('LP_WEBHOOK_SECRET'));
          hmac.update('anowner');
          hmac.update('aname');
          hmac = createHmac('sha1', hmac.digest('hex'));
          hmac.update(body);
          signature = hmac.digest('hex');
        });

        it('returns 200 OK', (done) => {
          supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'snap:build:0.1')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body)
            .expect(200, done);
        });

        it('leaves builds_released unmodified', async () => {
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          await dbUser.save({ builds_released: 1 });
          await supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'snap:build:0.1')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body);
          await dbUser.refresh();
          expect(dbUser.get('builds_released')).toEqual(1);
        });
      });

      context('if store_upload_status is Uploaded', () => {
        const body = JSON.stringify({ store_upload_status: 'Uploaded' });
        let signature;

        before(() => {
          let hmac = createHmac('sha1', conf.get('LP_WEBHOOK_SECRET'));
          hmac.update('anowner');
          hmac.update('aname');
          hmac = createHmac('sha1', hmac.digest('hex'));
          hmac.update(body);
          signature = hmac.digest('hex');
        });

        it('returns 200 OK', (done) => {
          supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'snap:build:0.1')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body)
            .expect(200, done);
        });

        it('leaves builds_released unmodified if it is unset', async () => {
          await supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'snap:build:0.1')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body);
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          expect(dbUser.get('builds_released')).toBeFalsy();
        });

        it('increments builds_released if it is set', async () => {
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          await dbUser.save({ builds_released: 1 });
          await supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'snap:build:0.1')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body);
          await dbUser.refresh();
          expect(dbUser.get('builds_released')).toEqual(2);
        });

        it('attributes builds_released to the registrant', async () => {
          const dbUser = await db.model('GitHubUser')
            .forge({
              github_id: 2,
              login: 'another',
              last_login_at: new Date(),
              builds_released: 1
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
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'snap:build:0.1')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body);
          await dbUser.refresh();
          expect(dbUser.get('builds_released')).toEqual(2);
        });
      });

      context('for a ping event', () => {
        const body = JSON.stringify({ ping: true });
        let signature;

        before(() => {
          let hmac = createHmac('sha1', conf.get('LP_WEBHOOK_SECRET'));
          hmac.update('anowner');
          hmac.update('aname');
          hmac = createHmac('sha1', hmac.digest('hex'));
          hmac.update(body);
          signature = hmac.digest('hex');
        });

        it('returns 200 OK', (done) => {
          supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'ping')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body)
            .expect(200, done);
        });

        it('leaves builds_released unmodified', async () => {
          const dbUser = await db.model('GitHubUser')
            .where({ login: 'anowner' })
            .fetch();
          await dbUser.save({ builds_released: 1 });
          await supertest(app)
            .post('/anowner/aname/webhook/notify')
            .type('application/json')
            .set('X-Launchpad-Event-Type', 'ping')
            .set('X-Hub-Signature', `sha1=${signature}`)
            .send(body);
          await dbUser.refresh();
          expect(dbUser.get('builds_released')).toEqual(1);
        });
      });
    });
  });
});
