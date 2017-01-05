import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';

import { conf } from '../../../../../src/server/helpers/config';

import {
  requestBuilds,
  requestBuildsSuccess,
  requestBuildsError
} from '../../../../../src/common/actions/request-snap-builds';
import * as ActionTypes from '../../../../../src/common/actions/request-snap-builds';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('request snap builds actions', () => {
  const initialState = {
    isFetching: false,
    builds: [],
    error: false
  };

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('requestBuildsSuccess', () => {
    let payload = [ { build: 'test1' }, { build: 'test2' }];

    beforeEach(() => {
      action = requestBuildsSuccess(payload);
    });

    it('should create an action to store snap builds', () => {
      const expectedAction = {
        type: ActionTypes.REQUEST_BUILDS_SUCCESS,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('requestBuildsError', () => {
    let payload = 'Something went wrong!';

    beforeEach(() => {
      action = requestBuildsError(payload);
    });

    it('should create an action to store request error on failure', () => {
      const expectedAction = {
        type: ActionTypes.REQUEST_BUILDS_ERROR,
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
            ActionTypes.REQUEST_BUILDS_SUCCESS
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
            ActionTypes.REQUEST_BUILDS_ERROR
          );
        });
    });
  });
});
