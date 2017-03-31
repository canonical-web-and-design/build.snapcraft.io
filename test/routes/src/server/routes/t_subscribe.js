import expect from 'expect';
import Express from 'express';
import nock from 'nock';
import supertest from 'supertest';
import url from 'url';

import {
  MAILCHIMP_FORM_URL,
  MAILCHIMP_FORM_U,
  MAILCHIMP_FORM_ID
} from '../../../../../src/server/handlers/subscribe';

import subscribe from '../../../../../src/server/routes/subscribe';

describe('The subscribe API endpoint', () => {
  const app = Express();
  app.use(subscribe);

  describe('private-repos route', () => {
    const formUrl = url.parse(MAILCHIMP_FORM_URL);
    const mailchimpUrl = url.format({
      protocol: formUrl.protocol,
      host: formUrl.host
    });

    let api;

    afterEach(() => {
      api.done();
      nock.cleanAll();
    });

    it('passes request through to mailchimp', async () => {
      api = nock(mailchimpUrl)
        .get(formUrl.pathname)
        .query({
          u: MAILCHIMP_FORM_U,
          id: MAILCHIMP_FORM_ID,
          EMAIL: 'test@email.com'
        })
        .reply(200, { result: 'success', msg: 'Done.' });

      const res = await supertest(app)
        .get('/subscribe/private-repos')
        .query({
          email: 'test@email.com'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ result: 'success', msg: 'Done.' });
    });

    context('when sanitizing HTML in response message', () => {
      let res;

      beforeEach(async () => {
        api = nock(mailchimpUrl)
          .get(formUrl.pathname)
          .query({
            u: MAILCHIMP_FORM_U,
            id: MAILCHIMP_FORM_ID,
            EMAIL: 'test@email.com'
          })
          .reply(200, {
            result: 'success',
            msg: 'This is some <a href="http://tests.com" onclick="alert();">evil</a> script. <script>alert("BOO!")</script>'
          });

        res = await supertest(app)
          .get('/subscribe/private-repos')
          .query({
            email: 'test@email.com'
          });
      });

      it('removes scripts', () => {
        expect(res.body.msg).toNotInclude('<script>');
        expect(res.body.msg).toNotInclude('onclick');
      });

      it('targets links to new tab', () => {
        expect(res.body.msg).toInclude('target="_blank"');
        expect(res.body.msg).toInclude('rel="noreferrer noopener"');
      });
    });

  });

});
