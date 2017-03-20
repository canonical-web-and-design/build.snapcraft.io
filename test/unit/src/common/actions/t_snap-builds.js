import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';

import { conf } from '../../../../../src/server/helpers/config';

import {
  fetchSnap,
  fetchBuilds,
  requestBuilds,
  fetchBuildsSuccess,
  fetchBuildsError
} from '../../../../../src/common/actions/snap-builds';
import * as ActionTypes from '../../../../../src/common/actions/snap-builds';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('snap builds actions', () => {
  let store;
  let action;

  const repo = 'dummy/repo';
  const repositoryUrl = `https://github.com/${repo}`;

  beforeEach(() => {
    store = mockStore({});
  });

  context('fetchBuildsSuccess', () => {
    let builds = [ { build: 'test1' }, { build: 'test2' }];

    beforeEach(() => {
      action = fetchBuildsSuccess(repo, builds);
    });

    it('should create an action to store snap builds', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_BUILDS_SUCCESS,
        payload: {
          id: repo,
          builds
        }
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('fetchBuildsError', () => {
    let error = 'Something went wrong!';

    beforeEach(() => {
      action = fetchBuildsError(repo, error);
    });

    it('should create an action to store request error on failure', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_BUILDS_ERROR,
        error: true,
        payload: {
          id: repo,
          error
        }
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('fetchBuilds', () => {
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      api.done();
      nock.cleanAll();
    });

    it('should store builds on fetch success', async () => {
      const snapUrl = 'https://api.launchpad.net/devel/~foo/+snap/bar';

      api.get('/api/launchpad/builds')
        .query({ snap: snapUrl })
        .reply(200, {
          status: 'success',
          payload: {
            code: 'snap-builds-found',
            builds: []
          }
        });

      await store.dispatch(fetchBuilds(repositoryUrl, snapUrl));
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.FETCH_BUILDS_SUCCESS
      );
    });

    it('should store error on Launchpad request failure', async () => {
      const barUrl = 'https://api.launchpad.net/devel/~foo/+snap/bad';

      api.get('/api/launchpad/builds')
        .query({ snap: barUrl })
        .reply(404, {
          status: 'error',
          payload: {
            code: 'lp-error',
            message: 'Something went wrong'
          }
        });

      await store.dispatch(fetchBuilds(repositoryUrl, barUrl));
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.FETCH_BUILDS_ERROR
      );
    });

  });

  context('fetchSnap', () => {
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      api.done();
      nock.cleanAll();
    });

    it('should dispatch FETCH_SNAP_SUCCESS with snap info on ' +
       'success', async () => {
      const repo = 'foo/bar';
      const repositoryUrl = `https://github.com/${repo}`;
      const snapUrl = 'https://api.launchpad.net/devel/~foo/+snap/bar';

      api.get('/api/launchpad/snaps')
        .query({
          repository_url: repositoryUrl // should be called with valid GH url
        })
        .reply(200, {
          status: 'success',
          payload: {
            code: 'snap-found',
            snap: {
              self_link: snapUrl
            }
          }
        });

      await store.dispatch(fetchSnap(repositoryUrl));
      expect(store.getActions()).toInclude({
        type: ActionTypes.FETCH_SNAP_SUCCESS,
        payload: {
          id: repo,
          snap: { self_link: snapUrl }
        }
      });
    });

    context('on builds call failure', () => {
      const barUrl = 'https://api.launchpad.net/devel/~foo/+snap/bad';

      beforeEach(() => {
        api.get('/api/launchpad/builds')
        .query({ snap: barUrl })
        .reply(404, {
          status: 'error',
          payload: {
            code: 'lp-error',
            message: 'Bad snap URL'
          }
        });
      });

      it('should dispatch error action', async () => {
        await store.dispatch(fetchBuilds(repositoryUrl, barUrl));
        expect(store.getActions()).toHaveActionOfType(
          ActionTypes.FETCH_BUILDS_ERROR
        );
      });

      it('should pass error message from repsponse to action', async () => {
        await store.dispatch(fetchBuilds(repositoryUrl, barUrl));
        const action = store.getActions()
          .filter((a) => a.type === ActionTypes.FETCH_BUILDS_ERROR)[0];
        expect(action.payload.error.message).toBe('Bad snap URL');
      });

    });

    context('on snaps call failure', () => {
      const badRepo = 'foo/bad';
      const repositoryUrl = `https://github.com/${badRepo}`;

      beforeEach(() => {
        api.get('/api/launchpad/snaps')
          .query({
            repository_url: repositoryUrl
          })
          .reply(404, {
            status: 'error',
            payload: {
              code: 'lp-error',
              message: 'Bad repo URL'
            }
          });
      });

      it('should dispatch error action', async () => {
        await store.dispatch(fetchSnap(repositoryUrl));
        expect(store.getActions()).toHaveActionOfType(
          ActionTypes.FETCH_BUILDS_ERROR
        );
      });

      it('should pass error message from repsponse to action', async () => {
        await store.dispatch(fetchSnap(repositoryUrl));
        const action = store.getActions()
          .filter((a) => a.type === ActionTypes.FETCH_BUILDS_ERROR)[0];
        expect(action.payload.error.message).toBe('Bad repo URL');
      });

    });

  });

  context('requestBuilds', () => {
    let api;
    const repo = 'foo/bar';
    const repositoryUrl = `https://github.com/${repo}`;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      api.done();
      nock.cleanAll();
    });

    it('should store builds on request success', async () => {
      api
        .post('/api/launchpad/snaps/request-builds', {
          repository_url: repositoryUrl
        })
        .reply(201, {
          status: 'success',
          payload: {
            code: 'snap-builds-requested',
            builds: []
          }
        });

      await store.dispatch(requestBuilds(repositoryUrl));
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.FETCH_BUILDS_SUCCESS
      );
    });

    it('should store error on Launchpad request failure', async () => {
      api
        .post('/api/launchpad/snaps/request-builds', {
          repository_url: repositoryUrl
        })
        .reply(404, {
          status: 'error',
          payload: {
            code: 'lp-error',
            message: 'Something went wrong'
          }
        });

      await store.dispatch(requestBuilds(repositoryUrl));
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.FETCH_BUILDS_ERROR
      );
    });
  });

});
