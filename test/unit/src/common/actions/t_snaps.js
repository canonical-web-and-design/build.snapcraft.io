import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';

import { conf } from '../../../../../src/server/helpers/config';

import {
  fetchUserSnaps,
  fetchSnapsSuccess,
  fetchSnapsError
} from '../../../../../src/common/actions/snaps';
import * as ActionTypes from '../../../../../src/common/actions/snaps';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('repositories actions', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    snaps: null
  };

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('fetchSnapsSuccess', () => {
    let payload = [ { full_name: 'test1' }, { full_name: 'test2' }];

    beforeEach(() => {
      action = fetchSnapsSuccess(payload);
    });

    it('should create an action to store snaps', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_SNAPS_SUCCESS,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('fetchSnapsError', () => {
    let payload = 'Something went wrong!';

    beforeEach(() => {
      action = fetchSnapsError(payload);
    });

    it('should create an action to store request error on failure', () => {
      const expectedAction = {
        type: ActionTypes.FETCH_SNAPS_ERROR,
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

  context('fetchUserSnaps', () => {
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      nock.cleanAll();
    });

    context('when snaps data successfully retrieved', () => {
      beforeEach(() => {
        api.get('/api/launchpad/snaps/list')
          .query({ owner: 'anowner' })
          .reply(200, {
            status: 'success',
            payload: {
              code: 'snaps-found',
              repos: []
            }
          });
      });

      it('should store repositories on fetch success', () => {
        return store.dispatch(fetchUserSnaps('anowner'))
          .then(() => {
            api.done();
            expect(store.getActions()).toHaveActionOfType(
              ActionTypes.FETCH_SNAPS_SUCCESS
            );
          });
      });

    });

    it('should store error on Launchpad request failure', () => {

      api.get('/api/launchpad/snaps/list')
        .query({ owner: 'anowner' })
        .reply(404, {
          status: 'error',
          payload: {
            code: 'lp-error',
            message: 'Something went wrong'
          }
        });

      return store.dispatch(fetchUserSnaps('anowner'))
        .then(() => {
          api.done();
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.FETCH_SNAPS_ERROR
          );
        });
    });

  });

});
