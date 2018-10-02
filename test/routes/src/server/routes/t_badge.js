import Express from 'express';
import supertest from 'supertest';
import expect, { spyOn } from 'expect';
import proxyquire from 'proxyquire';

const launchpadModule = {
  internalFindSnap: () => {},
  internalGetSnapBuilds: () => []
};

const badgeHandlerModule = proxyquire.noCallThru().load(
  '../../../../../src/server/handlers/badge',
  {
    './launchpad': launchpadModule
  }
);

const badge = proxyquire.noCallThru().load(
  '../../../../../src/server/routes/badge',
  {
    '../handlers/badge': badgeHandlerModule
  }
).default;

describe('The badge endpoint', () => {
  const app = Express();
  let spyOnFindSnap;
  let spyOnGetBuilds;

  app.use(badge);

  beforeEach(() => {
    spyOnFindSnap = spyOn(launchpadModule, 'internalFindSnap');
    spyOnGetBuilds = spyOn(launchpadModule, 'internalGetSnapBuilds');
  });

  afterEach(() => {
    expect.restoreSpies();
  });

  context('when there is no snap for given repo', () => {
    beforeEach(() => {
      spyOnFindSnap.andThrow(new Error('Snap not found'));
    });

    it('should return an error', async () => {
      await supertest(app).get('/badge/anowner/aname.svg').expect(404);
    });
  });

  context('when snap is available for given repo', () => {
    beforeEach(() => {
      spyOnFindSnap.andReturn({
        git_repository_url: 'https://github.com/anowner/aname'
      });
    });

    context('when there are builds for given repo', () => {
      beforeEach(() => {
        spyOnGetBuilds.andReturn([{
          resource_type_link: 'https://api.launchpad.net/devel/#snap_build',
          buildstate: 'Successfully built',
          store_upload_status: 'Uploaded'
        }]);
      });

      it('should return a 200 OK', async () => {
        await supertest(app).get('/badge/anowner/aname.svg').expect(200);
      });

      it('should return a SVG image with correct status', async () => {
        const response = await supertest(app).get('/badge/anowner/aname.svg')
          .expect('Content-Type', 'image/svg+xml').buffer();

        const responseString = response.body.toString();

        expect(responseString).toInclude('built and released');
      });
    });

    context('when there are no builds for given repo', () => {
      beforeEach(() => {
        spyOnGetBuilds.andReturn([]);
      });

      it('should return a 200 OK', async () => {
        await supertest(app).get('/badge/anowner/aname.svg').expect(200);
      });

      it('should return a SVG image with `never built` status', async () => {
        const response = await supertest(app).get('/badge/anowner/aname.svg')
          .expect('Content-Type', 'image/svg+xml').buffer();

        const responseString = response.body.toString();

        expect(responseString).toInclude('never built');
      });
    });
  });

});
