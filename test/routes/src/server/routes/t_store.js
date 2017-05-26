import expect from 'expect';
import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';

import store from '../../../../../src/server/routes/store';
import { conf } from '../../../../../src/server/helpers/config';

describe('The store API endpoint', () => {
  const app = Express();
  app.use(store);

  describe('snaps details route', () => {
    const snapName = 'test-snap-name';
    let api;

    beforeEach(() => {
      api = nock(conf.get('STORE_SEARCH_API_URL'))
        .get(`/snaps/details/${snapName}`)
        .matchHeader('X-Ubuntu-Series', '16');
    });

    afterEach(() => {
      api.done();
      nock.cleanAll();
    });

    it('passes request through to search api', async () => {
      api = api
        .reply(200, { package_name: 'test' });

      const res = await supertest(app).get(`/snaps/details/${snapName}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ package_name: 'test' });
    });

    it('passes request through to search api with only valid query params', async () => {
      api = api
        .query({ channel: 'stable' })
        .reply(200, { package_name: 'test' });

      const res = await supertest(app).get(`/snaps/details/${snapName}?channel=stable&foo=bar`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ package_name: 'test' });
    });

    it('passes request through to search api with empty channels param', async () => {
      api = api
        .query({ channel: '' })
        .reply(200, { package_name: 'test' });

      const res = await supertest(app).get(`/snaps/details/${snapName}?channel=`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ package_name: 'test' });
    });

    it('handles error responses reasonably', async () => {
      const error = {
        code: 'resource-not-found',
        message: 'Snap has no published revisions in the given context.'
      };

      api = api.reply(404, { error_list: [error] });

      const res = await supertest(app).get(`/snaps/details/${snapName}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error_list: [error] });
    });
  });

});
