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
  const initialState = {
    isFetching: false,
    snapLink: null,
    builds: [],
    error: false
  };

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('fetchBuildsSuccess', () => {
    let payload = [ { build: 'test1' }, { build: 'test2' }];

    beforeEach(() => {
      action = fetchBuildsSuccess(payload);
    });

    it('should create an action to store snap builds', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_BUILDS_SUCCESS,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('fetchBuildsError', () => {
    let payload = 'Something went wrong!';

    beforeEach(() => {
      action = fetchBuildsError(payload);
    });

    it('should create an action to store request error on failure', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_BUILDS_ERROR,
        error: true,
        payload
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
      nock.cleanAll();
    });

    it('should store builds on fetch success', () => {
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

      return store.dispatch(fetchBuilds(snapUrl))
        .then(() => {
          api.done();
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_BUILDS_SUCCESS
          );
        });
    });

    it('should store error on Launchpad request failure', () => {
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

      return store.dispatch(fetchBuilds(barUrl))
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_BUILDS_ERROR
          );
        });
    });

  });

  context('fetchSnap', () => {
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should store builds on fetch success', () => {
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
            message: snapUrl
          }
        });

      return store.dispatch(fetchSnap('foo/bar'))
        .then(() => {
          api.done();
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_SNAP_SUCCESS
          );
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

      it('should dispatch error action', () => {
        return store.dispatch(fetchBuilds(barUrl))
          .then(() => {
            expect(store.getActions()).toHaveActionOfType(
              ActionTypes.FETCH_BUILDS_ERROR
            );
          });
      });

      it('should pass error message from repsponse to action', () => {
        return store.dispatch(fetchBuilds(barUrl))
          .then(() => {
            const action = store.getActions().filter(a => a.type === ActionTypes.FETCH_BUILDS_ERROR)[0];
            expect(action.payload.message).toBe('Bad snap URL');
          });
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

      it('should dispatch error action', () => {
        return store.dispatch(fetchSnap(badRepo))
          .then(() => {
            expect(store.getActions()).toHaveActionOfType(
              ActionTypes.FETCH_BUILDS_ERROR
            );
          });
      });

      it('should pass error message from repsponse to action', () => {
        return store.dispatch(fetchSnap(badRepo))
          .then(() => {
            const action = store.getActions().filter(a => a.type === ActionTypes.FETCH_BUILDS_ERROR)[0];
            expect(action.payload.message).toBe('Bad repo URL');
          });
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
      nock.cleanAll();
    });

    it('should store builds on request success', () => {
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

      return store.dispatch(requestBuilds(repo))
        .then(() => {
          api.done();
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_BUILDS_SUCCESS
          );
        });
    });

    it('should store error on Launchpad request failure', () => {
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

      return store.dispatch(requestBuilds(repo))
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_BUILDS_ERROR
          );
        });
    });
  });

});
