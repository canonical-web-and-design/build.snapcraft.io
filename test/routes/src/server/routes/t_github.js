import { createHmac } from 'crypto';
import Express from 'express';
import supertest from 'supertest';
import nock from 'nock';
import expect from 'expect';
import { EOL } from 'os';

import github from '../../../../../src/server/routes/github';
import { conf } from '../../../../../src/server/helpers/config.js';

describe('The GitHub API endpoint', () => {
  const app = Express();
  const session = { 'token': 'secret', 'csrfTokens': ['blah']  };

  let scope;

  app.use((req, res, next) => {
    req.session = session;
    next();
  });
  app.use(github);

  describe('get snapcraft.yaml route', () => {
    const fullName = 'anowner/aname';

    let apiResponse;

    beforeEach(() => {
      apiResponse = supertest(app).get(`/github/snapcraft-yaml/${fullName}`);
    });

    context('when snap/snapcraft.yaml is valid', () => {

      beforeEach(() => {
        scope = nock(conf.get('GITHUB_API_ENDPOINT'))
          .get(`/repos/${fullName}/contents/snap/snapcraft.yaml`)
          .reply(200, 'name: snap-name');
      });

      afterEach(() => {
        scope.done();
        nock.cleanAll();
      });

      it('should successfully return', async () => {
        await apiResponse.expect(200);
      });

      it('should return a "success" status', async () => {
        await apiResponse.expect(hasStatus('success'));
      });

      it('should return a body with a "snapcraft-yaml-found" message', async () => {
        await apiResponse.expect(hasPayloadCode('snapcraft-yaml-found'));
      });

      it('should return a path to snap/snapcraft.yaml', async () => {
        const response = await apiResponse;
        expect(response.body.payload.path).toBe('snap/snapcraft.yaml');
      });

    });

    context('when /snapcraft.yaml is valid', () => {

      beforeEach(() => {
        scope = nock(conf.get('GITHUB_API_ENDPOINT'))
          .get(`/repos/${fullName}/contents/snap/snapcraft.yaml`)
          .reply(404, { message: 'Not Found' })
          .get(`/repos/${fullName}/contents/snapcraft.yaml`)
          .reply(200, 'name: snap-name');
      });

      afterEach(() => {
        scope.done();
        nock.cleanAll();
      });

      it('should successfully return', async () => {
        await apiResponse.expect(200);
      });

      it('should return a "success" status', async () => {
        await apiResponse.expect(hasStatus('success'));
      });

      it('should return a body with a "snapcraft-yaml-found" message', async () => {
        await apiResponse.expect(hasPayloadCode('snapcraft-yaml-found'));
      });

      it('should return a path to snapcraft.yaml', async () => {
        const response = await apiResponse;
        expect(response.body.payload.path).toBe('snapcraft.yaml');
      });
    });

    context('when /.snapcraft.yaml is valid', () => {

      beforeEach(() => {
        scope = nock(conf.get('GITHUB_API_ENDPOINT'))
          .get(`/repos/${fullName}/contents/snap/snapcraft.yaml`)
          .reply(404, { message: 'Not Found' })
          .get(`/repos/${fullName}/contents/snapcraft.yaml`)
          .reply(404, { message: 'Not Found' })
          .get(`/repos/${fullName}/contents/.snapcraft.yaml`)
          .reply(200, 'name: snap-name');
      });

      afterEach(() => {
        scope.done();
        nock.cleanAll();
      });

      it('should successfully return', async () => {
        await apiResponse.expect(200);
      });

      it('should return a "success" status', async () => {
        await apiResponse.expect(hasStatus('success'));
      });

      it('should return a body with a "snapcraft-yaml-found" message', async () => {
        await apiResponse.expect(hasPayloadCode('snapcraft-yaml-found'));
      });

      it('should return a path to .snapcraft.yaml', async () => {
        const response = await apiResponse;
        expect(response.body.payload.path).toBe('.snapcraft.yaml');
      });
    });

    context('when there is no valid snapcraft.yaml file', () => {

      beforeEach(() => {
        scope = nock(conf.get('GITHUB_API_ENDPOINT'))
          .get(`/repos/${fullName}/contents/snap/snapcraft.yaml`)
          .reply(404, { message: 'Not Found' })
          .get(`/repos/${fullName}/contents/snapcraft.yaml`)
          .reply(404, { message: 'Not Found' })
          .get(`/repos/${fullName}/contents/.snapcraft.yaml`)
          .reply(404, { message: 'Not Found' });
      });

      afterEach(() => {
        scope.done();
        nock.cleanAll();
      });

      it('should return 404 error', async () => {
        await apiResponse.expect(404);
      });

      it('should return a "error" status', async () => {
        await apiResponse.expect(hasStatus('error'));
      });

      it('should return a body with a "snapcraft-yaml-not-found" message', async () => {
        await apiResponse.expect(hasPayloadCode('github-snapcraft-yaml-not-found'));
      });

    });

  });

  describe('get user route', () => {

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
          .get('/github/user')
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/github/user')
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-authentication-failed" message', (done) => {
        supertest(app)
          .get('/github/repos')
          .expect(hasPayloadCode('github-authentication-failed'))
          .end(done);
      });
    });

    context('when user is logged in', () => {

      context('when GitHub returns an error', () => {
        const errorCode = 404;
        const errorMessage = 'Test error message';

        beforeEach(() => {
          scope = nock(conf.get('GITHUB_API_ENDPOINT'))
            .get('/user')
            .reply(errorCode, { message: errorMessage });
        });

        afterEach(() => {
          nock.cleanAll();
        });

        it('should return with same error code', (done) => {
          supertest(app)
          .post('/github/user')
          .expect(errorCode, done);
        });

        it('should return a "error" status', (done) => {
          supertest(app)
            .get('/github/user')
            .expect(hasStatus('error'))
            .end(done);
        });

        it('should return a body with a error message from GitHub', (done) => {
          supertest(app)
            .get('/github/user')
            .expect(hasPayloadCode('github-user-error', errorMessage))
            .end(done);
        });
      });

      context('when GitHub returns user data', () => {
        const user = {
          id: 1234,
          login: 'johndoe',
          name: 'John Doe'
        };

        beforeEach(() => {
          scope = nock(conf.get('GITHUB_API_ENDPOINT'))
            .get('/user')
            .reply(200, user);
        });

        afterEach(() => {
          nock.cleanAll();
        });

        it('should return with 200', (done) => {
          supertest(app)
          .get('/github/user')
          .expect(200, done);
        });

        it('should return a "success" status', (done) => {
          supertest(app)
            .get('/github/user')
            .expect(hasStatus('success'))
            .end(done);
        });

        it('should return a body with a "github-user" code', (done) => {
          supertest(app)
            .get('/github/user')
            .expect(hasPayloadCode('github-user'))
            .end(done);
        });

        it('should return user', (done) => {
          supertest(app)
            .get('/github/user')
            .end((err, res) => {
              expect(res.body.payload.user).toEqual(user);
              done(err);
            });
        });

      });
    });
  });

  describe('get user orgs route', () => {

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
          .get('/github/orgs')
          .set('X-CSRF-Token', 'blah')
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .get('/github/orgs')
          .set('X-CSRF-Token', 'blah')
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-authentication-failed" message', (done) => {
        supertest(app)
          .get('/github/orgs')
          .set('X-CSRF-Token', 'blah')
          .expect(hasPayloadCode('github-authentication-failed'))
          .end(done);
      });
    });

    context('when user is logged in', () => {

      context('when GitHub returns an error', () => {
        const errorCode = 404;
        const errorMessage = 'Test error message';

        beforeEach(() => {
          scope = nock(conf.get('GITHUB_API_ENDPOINT'))
            .get('/user/orgs')
            .reply(errorCode, { message: errorMessage });
        });

        afterEach(() => {
          scope.done();
          nock.cleanAll();
        });

        it('should return 200', async () => {
          await supertest(app)
            .get('/github/orgs')
            .set('X-CSRF-Token', 'blah')
            .expect(200);
        });

        it('should return a "error" status', async () => {
          await supertest(app)
            .get('/github/orgs')
            .set('X-CSRF-Token', 'blah')
            .expect(hasStatus('success'));
        });

        it('should return a body with empty orgs', async () => {
          const res = await supertest(app)
            .get('/github/orgs')
            .set('X-CSRF-Token', 'blah');

          expect(res.body.orgs).toEqual([]);
        });
      });

      context('when GitHub returns orgs', () => {
        const orgs = [{ login: 'org1' }, { login: 'org2' }];

        beforeEach(() => {
          scope = nock(conf.get('GITHUB_API_ENDPOINT'))
            .get('/user/orgs')
            .reply(200, orgs);
        });

        afterEach(() => {
          scope.done();
          nock.cleanAll();
        });

        it('should return with 200', async () => {
          await supertest(app)
            .get('/github/orgs')
            .set('X-CSRF-Token', 'blah')
            .expect(200);
        });

        it('should return a "success" status', async () => {
          await supertest(app)
            .get('/github/orgs')
            .set('X-CSRF-Token', 'blah')
            .expect(hasStatus('success'));
        });

        it('should return orgs', async () => {
          const res = await supertest(app)
            .get('/github/orgs')
            .set('X-CSRF-Token', 'blah');

          expect(res.body.orgs).toEqual(orgs);
        });

        it('should return update orgs in session', async () => {
          session.user = {
            orgs: [{ login: 'oldOrg' }]
          };
          await supertest(app)
            .get('/github/orgs')
            .set('X-CSRF-Token', 'blah');

          expect(session.user.orgs).toEqual(orgs);

          delete session.user;
        });

      });
    });
  });

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
          .get('/github/repos')
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
          .expect(hasPayloadCode('github-authentication-failed'))
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
            .query({ affiliation: 'owner,organization_member' })
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
            .expect(hasPayloadCode('github-list-repositories-error', errorMessage))
            .end(done);
        });
      });

      context('when GitHub returns repositories', () => {
        const repos = [
          {
            id: 1,
            full_name: 'anowner/repo1',
            url: 'https://github.com/anowner/repo1',
            permissions: { admin: true }
          },
          {
            id: 2,
            full_name: 'anowner/repo2',
            url: 'https://github.com/anowner/repo2',
            permissions: { admin: true }
          },
          {
            id: 3,
            full_name: 'anowner/repo3',
            url: 'https://github.com/anowner/repo3',
            permissions: { admin: false }
          }
        ];
        const pageLinks = { first: 1, prev: 1, next: 3, last: 3 };

        beforeEach(() => {
          const api = nock(conf.get('GITHUB_API_ENDPOINT'));
          api.get('/user/repos')
            .query({ affiliation: 'owner,organization_member' })
            .reply(200, repos, {
              Link: [
                '<https://api.github.com?&page=1&per_page=30>; rel="first"',
                '<https://api.github.com?&page=1&per_page=30>; rel="prev"',
                '<https://api.github.com?&page=3&per_page=30>; rel="next"',
                '<https://api.github.com?&page=3&per_page=30>; rel="last"'
              ].join(',')
            });
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
            .expect(hasBodyCode('github-list-repositories'))
            .end(done);
        });

        it('should return repositories with admin permissions', (done) => {
          supertest(app)
            .get('/github/repos')
            .end((err, res) => {
              expect(res.body.result).toEqual([1, 2]);
              expect(res.body.entities.repos).toMatch({
                1: { fullName: 'anowner/repo1' },
                2: { fullName: 'anowner/repo2' }
              });
              done(err);
            });
        });

        it('should return pagelinks', (done) => {
          supertest(app)
            .get('/github/repos')
            .end((err, res) => {
              expect(res.body.pageLinks).toEqual(pageLinks);
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
          .set('X-CSRF-Token', 'blah')
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
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(201, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a "github-webhook-created" message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasPayloadCode('github-webhook-created'))
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

      it('should return a 200 OK', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(200, done);
      });

      it('should return a "success" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('success'))
          .end(done);
      });

      it('should return a body with a "github-already-created" message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasPayloadCode('github-already-created'))
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
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(404, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a "github-repository-not-found" message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasPayloadCode('github-repository-not-found'))
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
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(401, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a github-authentication-failed message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasPayloadCode('github-authentication-failed'))
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
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(500, done);
      });

      it('should return a "error" status', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasStatus('error'))
          .end(done);
      });

      it('should return a body with a github-error-other message', (done) => {
        supertest(app)
          .post('/github/webhook')
          .set('X-CSRF-Token', 'blah')
          .send({ owner: 'anowner', name: 'aname' })
          .expect(hasPayloadCode('github-error-other'))
          .end(done);
      });
    });
  });
});

const hasStatus = (expected) => {
  return (actual) => {
    if (typeof actual.body.status === 'undefined' || actual.body.status !== expected) {
      throw new Error(`Response does not have status ${expected} instead of ${actual.body.status}`);
    }
  };
};

const hasPayloadCode = (expected) => {
  return (actual) => {
    if (typeof actual.body.payload === 'undefined'
        || typeof actual.body.payload.code === 'undefined'
        || actual.body.payload.code !== expected) {
      throw new Error(`Expected response payload with code: ${expected} ${EOL} Actual: ${actual.body.payload.code}`);
    }
  };
};

const hasBodyCode = (expected) => {
  return (actual) => {
    if (typeof actual.body.code === 'undefined'
      || actual.body.code !== expected) {
      throw new Error(`Expected response body with code: ${expected} ${EOL} Actual: ${actual.body.code}`);
    }
  };
};
