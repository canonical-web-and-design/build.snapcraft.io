import { createHmac } from 'crypto';
import Express from 'express';
import supertest from 'supertest';

import { conf } from '../../../../../src/server/helpers/config';
import github from '../../../../../src/server/routes/webhook';

describe('The WebHook API endpoint', () => {
  let app;
  app = Express();
  app.use(github);

  describe('notify route', () => {
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
        .set('X-Hub-Signature', 'dummy')
        .send('"bad"')
        .expect(400, done);
    });

    it('rejects requests with a bad signature', (done) => {
      const body = JSON.stringify({ ref: 'refs/heads/master' });
      const hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
      hmac.update('anaccount');
      hmac.update('arepo');
      hmac.update(body + ' ');
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .type('application/json')
        .set('X-Hub-Signature', `sha1=${hmac.digest('hex')}`)
        .send(body)
        .expect(400, done);
    });

    it('returns 200 OK if the signature is good', (done) => {
      const body = JSON.stringify({ ref: 'refs/heads/master' });
      const hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
      hmac.update('anaccount');
      hmac.update('arepo');
      hmac.update(body);
      supertest(app)
        .post('/anaccount/arepo/webhook/notify')
        .type('application/json')
        .set('X-Hub-Signature', `sha1=${hmac.digest('hex')}`)
        .send(body)
        .expect(200, done);
    });
  });
});
