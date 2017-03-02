import { createHmac } from 'crypto';
import expect from 'expect';
import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';

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

    describe('with a good signature', () => {
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

      describe('if auto_build is true', () => {
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
                  auto_build: true
                }
              ]
            });
          requestAutoBuilds = nock(lp_api_url)
            .post(`/devel${lp_snap_path}`, { 'ws.op': 'requestAutoBuilds' })
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

      describe('if auto_build is false', () => {
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
              .post(`/devel${lp_snap_path}`, { 'ws.op': 'requestAutoBuilds' })
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
  });
});
