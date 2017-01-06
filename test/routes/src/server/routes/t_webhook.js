import { createHmac } from 'crypto';
import expect from 'expect';
import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';

import { conf } from '../../../../../src/server/helpers/config';
import github from '../../../../../src/server/routes/webhook';

describe('The WebHook API endpoint', () => {
  let app;
  app = Express();
  app.use(github);

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

  afterEach(() => {
    nock.cleanAll();
  });

  describe('notify route', () => {
    const lp_snap_user = 'test-user';
    const lp_snap_path = `/~${lp_snap_user}/+snap/test-snap`;

    it('rejects unsigned requests', (done) => {
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .send({})
        .expect(400, done);
    });

    it('rejects requests containing non-object JSON data', (done) => {
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature', 'dummy')
        .send('"bad"')
        .expect(400, done);
    });

    it('rejects requests with a bad signature', (done) => {
      const body = JSON.stringify({ ref: 'refs/heads/master' });
      let hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
      hmac.update('anaccount');
      hmac.update('arepo');
      hmac = createHmac('sha1', hmac.digest('hex'));
      hmac.update(body + ' ');
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature', `sha1=${hmac.digest('hex')}`)
        .send(body)
        .expect(400, done);
    });

    it('returns 200 OK and requests builds if the signature is ' +
       'good', (done) => {
      const lp_api_url = conf.get('LP_API_URL');
      const lp_api_base = `${lp_api_url}/devel`;
      const findByURL = nock(lp_api_url)
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
      const requestAutoBuilds = nock(lp_api_url)
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

      const body = JSON.stringify({ ref: 'refs/heads/master' });
      let hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
      hmac.update('anaccount');
      hmac.update('arepo');
      hmac = createHmac('sha1', hmac.digest('hex'));
      hmac.update(body);
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature', `sha1=${hmac.digest('hex')}`)
        .send(body)
        .expect(200, (err) => {
          findByURL.done();
          requestAutoBuilds.done();
          done(err);
        });
    });

    it('returns 500 if it fails to request builds', (done) => {
      nock(conf.get('LP_API_URL'))
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

      const body = JSON.stringify({ ref: 'refs/heads/master' });
      let hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
      hmac.update('anaccount');
      hmac.update('arepo');
      hmac = createHmac('sha1', hmac.digest('hex'));
      hmac.update(body);
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature', `sha1=${hmac.digest('hex')}`)
        .send(body)
        .expect(500, done);
    });

    it('returns 200 but does not request builds for a ping event', (done) => {
      const lp_api_url = conf.get('LP_API_URL');
      const findByURL = nock(lp_api_url)
        .get('/devel/+snaps')
        .reply(500);
      const requestAutoBuilds = nock(lp_api_url)
        .post(`/devel${lp_snap_path}`)
        .reply(500);

      const body = JSON.stringify({ ref: 'refs/heads/master' });
      let hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
      hmac.update('anaccount');
      hmac.update('arepo');
      hmac = createHmac('sha1', hmac.digest('hex'));
      hmac.update(body);
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .type('application/json')
        .set('X-GitHub-Event', 'ping')
        .set('X-Hub-Signature', `sha1=${hmac.digest('hex')}`)
        .send(body)
        .expect(200, (err) => {
          expect(findByURL.isDone()).toBe(false);
          expect(requestAutoBuilds.isDone()).toBe(false);
          done(err);
        });
    });
  });
});
