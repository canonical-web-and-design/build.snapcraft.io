import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';

import { conf } from '../../../../../src/server/helpers/config';

import {
  fetchUser,
  setUser,
  fetchUserError
} from '../../../../../src/common/actions/user';
import * as ActionTypes from '../../../../../src/common/actions/user';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('repositories actions', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    user: null
  };

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('setUser', () => {
    let payload = {
      login: 'johndoe',
      name: 'John Doe'
    };

    beforeEach(() => {
      action = setUser(payload);
    });

    it('should create an action to store user', () => {
      const expectedAction = {
        type: ActionTypes.SET_USER,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('fetchUserError', () => {
    let payload = 'Something went wrong!';

    beforeEach(() => {
      action = fetchUserError(payload);
    });

    it('should create an action to store request error on failure', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_USER_ERROR,
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

  context('fetchUser', () => {
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      nock.cleanAll();
    });

    context('when user data successfully retrieved', () => {
      beforeEach(() => {
        api.get('/api/github/user')
          .reply(200, {
            status: 'success',
            payload: {
              code: 'github-user',
              user: { login: 'johndoe' }
            }
          });
      });

      it('should store user on fetch success', () => {
        return store.dispatch(fetchUser())
          .then(() => {
            api.done();
            expect(store.getActions()).toHaveActionOfType(
              ActionTypes.SET_USER
            );
          });
      });

    });

    it('should store error on GitHub request failure', () => {

      api.get('/api/github/user')
        .reply(404, {
          status: 'error',
          payload: {
            code: 'gh-error',
            message: 'Something went wrong'
          }
        });

      return store.dispatch(fetchUser())
        .then(() => {
          api.done();
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_USER_ERROR
          );
        });
    });

  });

});
