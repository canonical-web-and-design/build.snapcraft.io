import Express from 'express';
import supertest from 'supertest';

import github from '../../../../../src/server/routes/webhook';

describe('The WebHook API endpoint', () => {
  let app;
  app = Express();
  app.use(github);

  describe('notify route', () => {
    it('should return a 200 Okay response', (done) => {
      supertest(app)
        .post('/webhook/notify')
        .send()
        .expect(200, done);
    });
  });
});
