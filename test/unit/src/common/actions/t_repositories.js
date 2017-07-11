import expect from 'expect';
import nock from 'nock';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { isFSA } from 'flux-standard-action';

import {
  fetchUserRepositories,
  fetchChainedUserRepos,
  searchRepos
} from '../../../../../src/common/actions/repositories';
import * as ActionTypes from '../../../../../src/common/actions/repositories';
import callApi, { CALL_API } from '../../../../../src/common/middleware/call-api';

import { conf } from '../../../../../src/common/helpers/config';
const middlewares = [ thunk, callApi({ endpoint: conf.get('BASE_URL') }) ];
const mockStore = configureMockStore(middlewares);

describe('repositories actions', () => {
  describe('fetchUserRepositories', () => {
    context('when not supplied with a page number', () => {
      let pageNumber;

      beforeEach(() => {
        pageNumber = null;
      });

      it('should supply request, success and failure actions when invoking CALL_API', () => {
        expect(fetchUserRepositories(pageNumber)[CALL_API].types).toEqual([
          ActionTypes.REPOSITORIES_REQUEST,
          ActionTypes.REPOSITORIES_SUCCESS,
          ActionTypes.REPOSITORIES_FAILURE,
          ActionTypes.REPOSITORIES_DELAYED
        ]);
      });
    });

    context('when supplied with a page number', () => {
      let pageNumber;

      beforeEach(() => {
        pageNumber = 123;
      });

      it('should supply a request path containing the page number', () => {
        expect(fetchUserRepositories(pageNumber)[CALL_API].path).toInclude(123);
      });
    });
  });

  describe('fetchChainedUserRepos', () => {
    let store;
    let api;

    beforeEach(() => {
      store = mockStore({});
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      api.done();
      nock.cleanAll();
    });

    context('when there is only one page of results', () => {
      beforeEach(() => {
        api.get('/api/github/repos')
          .reply(200, {
            status: 'success',
            pageLinks: { first: 1, last: 1 }
          });
      });

      it('should fetch only one page of repositories', async () => {
        await store.dispatch(fetchChainedUserRepos());
        const requestActions = store.getActions().filter((action) => {
          return action.type === ActionTypes.REPOSITORIES_REQUEST;
        });
        expect(requestActions.length).toBe(1);
      });
    });

    context('when there are multiple pages of results', () => {
      beforeEach(() => {
        api
          .get('/api/github/repos')
          .reply(200, {
            status: 'success',
            pageLinks: { first: 1, next: 2, last: 3 }
          })
          .get('/api/github/repos')
          .query({ page: 2 })
          .reply(200, {
            status: 'success',
            pageLinks: { first: 1, prev: 1, next: 3, last: 3 }
          })
          .get('/api/github/repos')
          .query({ page: 3 })
          .reply(200, {
            status: 'success',
            pageLinks: { first: 1, prev: 2, last: 3 }
          });
      });

      it('should fetch only one page of repositories', async () => {
        await store.dispatch(fetchChainedUserRepos());
        const requestActions = store.getActions().filter((action) => {
          return action.type === ActionTypes.REPOSITORIES_REQUEST;
        });
        expect(requestActions.length).toBe(3);
      });
    });
  });

  describe('searchRepos', () => {
    let store;

    beforeEach(() => {
      store = mockStore({});
    });

    it('should create an action to update search term', () => {
      const expectedAction = {
        type: ActionTypes.REPOSITORIES_SEARCH,
        payload: 'test'
      };

      store.dispatch(searchRepos('test'));
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(searchRepos('test'))).toBe(true);
    });
  });
});
