import { createHmac } from 'crypto';
import Express from 'express';
import supertest from 'supertest';
import nock from 'nock';
import expect from 'expect';

import github from '../../../../../src/server/routes/github';
import { conf } from '../../../../../src/server/helpers/config.js';

describe('The GitHub API endpoint', () => {
  const app = Express();
  const session = { 'token': 'secret' };

  let scope;

  app.use((req, res, next) => {
    req.session = session;
    next();
  });
  app.use(github);

  describe('list repositories route', () => {

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
          .get('/github/repos', { affiliation: 'owner' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/github/repos')
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-authentication-failed" message', (done) => {
        supertest(app)
          .get('/github/repos')
          .expect(hasMessage('github-authentication-failed'))
          .end(done);
      });
    });

    context('when user is logged in', () => {

      context('when GitHub returns an error', () => {
        const errorCode = 404;
        const errorMessage = 'Test error message';

        beforeEach(() => {
          scope = nock(conf.get('GITHUB_API_ENDPOINT'))
            .get('/user/repos')
            .query({ affiliation: 'owner' })
            .reply(errorCode, { message: errorMessage });
        });

        afterEach(() => {
          nock.cleanAll();
        });

        it('should return with same error code', (done) => {
          supertest(app)
          .post('/github/repos')
          .expect(errorCode, done);
        });

        it('should return a "error" status', (done) => {
          supertest(app)
            .get('/github/repos')
            .expect(hasStatus('error'))
            .end(done);
        });

        it('should return a body with a error message from GitHub', (done) => {
          supertest(app)
            .get('/github/repos')
            .expect(hasMessage('github-list-repositories-error', errorMessage))
            .end(done);
        });
      });

      context('when GitHub returns repositories', () => {
        const repos = [ { name: 'repo1' }, { name: 'repo2' }];

        beforeEach(() => {
          scope = nock(conf.get('GITHUB_API_ENDPOINT'))
            .get('/user/repos')
            .query({ affiliation: 'owner' })
            .reply(200, repos);
        });

        afterEach(() => {
          nock.cleanAll();
        });

        it('should return with 200', (done) => {
          supertest(app)
          .get('/github/repos')
          .expect(200, done);
        });

        it('should return a "success" status', (done) => {
          supertest(app)
            .get('/github/repos')
            .expect(hasStatus('success'))
            .end(done);
        });

        it('should return a body with a "github-list-repositories" code', (done) => {
          supertest(app)
            .get('/github/repos')
            .expect(hasMessage('github-list-repositories'))
            .end(done);
        });

        it('should return user repositories', (done) => {
          supertest(app)
            .get('/github/repos')
            .end((err, res) => {
              expect(res.body.payload.repos).toEqual(repos);
              done(err);
            });
        });

      });
    });

  });

  describe('create webhook route', () => {
    context('when webhook does not already exist', () => {
      beforeEach(() => {
        const hmac = createHmac('sha1', conf.get('GITHUB_WEBHOOK_SECRET'));
        hmac.update('anowner');
        hmac.update('aname');
        scope = nock(conf.get('GITHUB_API_ENDPOINT'))
          .post('/repos/anowner/aname/hooks', {
            name: 'web',
            active: true,
            events: ['push'],
            config: {
              url: `${conf.get('BASE_URL')}/anowner/aname/webhook/notify`,
              content_type: 'json',
              secret: hmac.digest('hex')
            }
          })
          .reply(201, '');
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should call GitHub API endpoint to create new webhook', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .end((err) => {
            scope.done();
            done(err);
          }
        );
      });

      it('should return a 201 created response', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(201, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a "github-webhook-created" message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasMessage('github-webhook-created'))
          .end(done);
      });
    });

    context('when webhook already exists', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .post('/repos/anowner/aname/hooks')
          .reply(422, { message: 'Validation Failed' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 422 Unprocessable Entity response', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(422, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-already-created" message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasMessage('github-already-created'))
          .end(done);
      });
    });

    context('when repo does not exist', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .post('/repos/anowner/aname/hooks')
          .reply(404, { message: 'Not Found' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 404 Not Found response', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-repository-not-found" message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasMessage('github-repository-not-found'))
          .end(done);
      });
    });

    context('when authentication has failed', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .post('/repos/anowner/aname/hooks')
          .reply(401, { message: 'Bad credentials' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 401 Unauthorized response', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a github-authentication-failed message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasMessage('github-authentication-failed'))
          .end(done);
      });
    });

    context('when any other response is received', () => {
      beforeEach(() => {
        nock(conf.get('GITHUB_API_ENDPOINT'))
          .post('/repos/anowner/aname/hooks')
          .reply(418, { message: 'I\'m a teapot' });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should return a 500 Internal Server Error response', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(500, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a github-error-other message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasMessage('github-error-other'))
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

const hasMessage = (expected) => {
  return (actual) => {
    if (typeof actual.body.payload === 'undefined'
        || typeof actual.body.payload.code === 'undefined'
        || actual.body.payload.code !== expected) {
      throw new Error('Response does not have payload with code ' + expected);
    }
  };
};
