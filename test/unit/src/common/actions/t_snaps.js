import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';

import { conf } from '../../../../../src/server/helpers/config';

import {
  fetchUserSnaps,
  fetchSnapsSuccess,
  fetchSnapsError,
  removeSnap,
  removeSnapSuccess,
  removeSnapError
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
      api.done();
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

      it('should store repositories on fetch success', async () => {
        await store.dispatch(fetchUserSnaps('anowner'));
        expect(store.getActions()).toHaveActionOfType(
          ActionTypes.FETCH_SNAPS_SUCCESS
        );
      });

    });

    it('should store error on Launchpad request failure', async () => {
      api.get('/api/launchpad/snaps/list')
        .query({ owner: 'anowner' })
        .reply(404, {
          status: 'error',
          payload: {
            code: 'lp-error',
            message: 'Something went wrong'
          }
        });

      await store.dispatch(fetchUserSnaps('anowner'));
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.FETCH_SNAPS_ERROR
      );
    });

  });

  context('removeSnap', () => {
    const repositoryUrl = 'https://github.com/anowner/aname';
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      api.done();
      nock.cleanAll();
    });

    it('stores success action on successful removal', async () => {
      api
        .post('/api/launchpad/snaps/delete', { repository_url: repositoryUrl })
        .reply(200, {
          status: 'success',
          payload: {
            code: 'snap-deleted',
            message: 'Snap deleted'
          }
        });

      await store.dispatch(removeSnap(repositoryUrl));
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.REMOVE_SNAP_SUCCESS
      );
    });

    it('stores error action on failed removal', async () => {
      api
        .post('/api/launchpad/snaps/delete', { repository_url: repositoryUrl })
        .reply(404, {
          status: 'error',
          payload: {
            code: 'lp-error',
            message: 'Something went wrong'
          }
        });

      await store.dispatch(removeSnap(repositoryUrl));
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.REMOVE_SNAP_ERROR
      );
    });
  });

  context('removeSnapSuccess', () => {
    const repositoryUrl = 'https://github.com/anowner/aname';

    beforeEach(() => {
      action = removeSnapSuccess(repositoryUrl);
    });

    it('creates an action to indicate successful removal', () => {
      const expectedAction = {
        type: ActionTypes.REMOVE_SNAP_SUCCESS,
        payload: { repository_url: repositoryUrl }
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('creates a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('removeSnapError', () => {
    const repositoryUrl = 'https://github.com/anowner/aname';

    beforeEach(() => {
      action = removeSnapError(repositoryUrl, 'Something went wrong!');
    });

    it('creates an action to store request error on failure', () => {
      const expectedAction = {
        type: ActionTypes.REMOVE_SNAP_ERROR,
        payload: {
          repository_url: repositoryUrl,
          error: 'Something went wrong!',
        },
        error: true,
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('creates a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });
});
