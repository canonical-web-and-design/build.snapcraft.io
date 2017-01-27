import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';

import { conf } from '../../../../../src/server/helpers/config';

import {
  fetchUserRepositories,
  setRepositories,
  fetchRepositoriesError
} from '../../../../../src/common/actions/repositories';
import * as ActionTypes from '../../../../../src/common/actions/repositories';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('repositories actions', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    repos: null
  };

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('setRepositories', () => {
    let payload = [ { full_name: 'test1' }, { full_name: 'test2' }];

    beforeEach(() => {
      action = setRepositories(payload);
    });

    it('should create an action to store snap builds', () => {
      const expectedAction = {
        type: ActionTypes.SET_REPOSITORIES,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('fetchRepositoriesError', () => {
    let payload = 'Something went wrong!';

    beforeEach(() => {
      action = fetchRepositoriesError(payload);
    });

    it('should create an action to store request error on failure', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_REPOSITORIES_ERROR,
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

  context('fetchUserRepositories', () => {
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should store repositories on fetch success', () => {

      api.get('/api/github/repos')
        .reply(200, {
          status: 'success',
          payload: {
            code: 'snap-builds-found',
            repos: []
          }
        });

      return store.dispatch(fetchUserRepositories())
        .then(() => {
          api.done();
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.SET_REPOSITORIES
          );
        });
    });

    it('should store error on Launchpad request failure', () => {

      api.get('/api/github/repos')
        .reply(404, {
          status: 'error',
          payload: {
            code: 'gh-error',
            message: 'Something went wrong'
          }
        });

      return store.dispatch(fetchUserRepositories())
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_REPOSITORIES_ERROR
          );
        });
    });

  });

});
