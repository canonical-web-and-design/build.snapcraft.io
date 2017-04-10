import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';

import { conf } from '../../../../../src/server/helpers/config';

import {
  fetchUserRepositories,
  fetchRepositoriesSuccess,
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

  context('fetchRepositoriesSuccess', () => {
    let result = {
      payload: {
        entities: {
          repos: {
            123: { fullName: 'test1' },
            456: { fullName: 'test2' }
          }
        },
        result: {
          0: 123,
          1: 456
        }
      },
      pageLinks: {
        next: 2,
        last: 2
      }
    };

    beforeEach(() => {
      action = fetchRepositoriesSuccess(result);
    });

    it('should create an action to store repositories', () => {
      store.dispatch(action);
      expect(store.getActions()).toHaveActionsMatching((action) => {
        return action.payload.entities == result.payload.entities
          && action.payload.result == result.payload.result;
      });
    });

    it('should supply pagelinks in action payload', () => {
      store.dispatch(action);
      expect(store.getActions()).toHaveActionsMatching((action) => {
        return action.payload.pageLinks == result.pageLinks;
      });
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
        type: ActionTypes.REPOSITORIES_FAILURE,
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
      api.done();
      nock.cleanAll();
    });

    context('when repository data successfully retrieved', () => {
      beforeEach(() => {
        api.get('/api/github/repos')
          .reply(200, {
            status: 'success',
            payload: {
              code: 'snap-builds-found',
              repos: []
            },
            pageLinks: {
              first: '1',
              prev: '1',
              next: '3',
              last: '3'
            }
          });
      });

      it('should store repositories on fetch success', () => {
        return store.dispatch(fetchUserRepositories())
          .then(() => {
            api.done();
            expect(store.getActions()).toHaveActionOfType(
              ActionTypes.REPOSITORIES_REQUEST
            );
          });
      });
    });

    context('when one page of repo data successfully retrieved', () => {
      beforeEach(() => {
        api.get('/api/github/repos')
          .reply(200, {
            status: 'success',
            payload: {
              code: 'snap-builds-found',
              repos: []
            }
          });
      });

      it('should store no pageLinks', async () => {
        await store.dispatch(fetchUserRepositories());
        expect(store.getActions()).notToHaveActionOfType(
          ActionTypes.SET_REPO_PAGE_LINKS
        );
      });
    });

    it('should store error on Launchpad request failure', async () => {
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
            ActionTypes.REPOSITORIES_FAILURE
          );
        });
    });

  });

});
