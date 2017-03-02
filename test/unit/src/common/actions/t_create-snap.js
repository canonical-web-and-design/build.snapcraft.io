import expect from 'expect';
import { isFSA } from 'flux-standard-action';
import nock from 'nock';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { conf } from '../../../../../src/common/helpers/config';
import {
  createSnaps,
  createSnapError,
  createSnapSuccess,
  createWebhook,
  setGitHubRepository
} from '../../../../../src/common/actions/create-snap';
import * as ActionTypes from '../../../../../src/common/actions/create-snap';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('create snap actions', () => {
  const initialState = {
    isFetching: false,
    inputValue: '',
    repository: {
      fullName: null
    },
    statusMessage: '',
    success: false,
    error: false
  };

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('setGitHubRepository', () => {
    let payload = 'foo/bar';

    beforeEach(() => {
      action = setGitHubRepository(payload);
    });

    it('should create an action to update repository name', () => {
      const expectedAction = {
        type: ActionTypes.SET_GITHUB_REPOSITORY,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('createWebhook', () => {
    const repository = {
      url: 'https://github.com/foo/bar',
      fullName: 'foo/bar',
      owner: 'foo',
      name: 'bar'
    };
    const BASE_URL = conf.get('BASE_URL');
    let scope;

    beforeEach(() => {
      scope = nock(BASE_URL);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('throws an error on failure to create webhook', () => {
      scope
        .post('/api/github/webhook', { owner: 'foo', name: 'bar' })
        .reply(404, {
          status: 'error',
          payload: { code: 'github-repository-not-found' }
        });
      return createWebhook(repository)
        .then(() => { throw new Error('unexpected success'); })
        .catch((error) => {
          scope.done();
          expect(error.json.payload.code).toEqual(
            'github-repository-not-found'
          );
        });
    });

    it('succeeds if creating webhook says already created', () => {
      scope
        .post('/api/github/webhook', { owner: 'foo', name: 'bar' })
        .reply(422, {
          status: 'error',
          payload: { code: 'github-already-created' }
        });
      return createWebhook(repository)
        .then(() => scope.done());
    });

    it('succeeds if creating webhook succeeds', () => {
      scope
        .post('/api/github/webhook', { owner: 'foo', name: 'bar' })
        .reply(201, {
          status: 'success',
          payload: { code: 'github-webhook-created' }
        });
      return createWebhook(repository)
        .then(() => scope.done());
    });
  });

  context('createSnaps', () => {
    const repository = {
      url: 'https://github.com/foo/bar',
      fullName: 'foo/bar',
      owner: 'foo',
      name: 'bar'
    };
    const BASE_URL = conf.get('BASE_URL');
    let scope;

    beforeEach(() => {
      scope = nock(BASE_URL);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('stores a CREATE_SNAPS_CLEAR action', () => {
      return store.dispatch(createSnaps([ repository ]))
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.CREATE_SNAPS_CLEAR
          );
          scope.done();
        });
    });

    it('stores an error if creating webhook fails', () => {
      scope
        .post('/api/github/webhook', { owner: 'foo', name: 'bar' })
        .reply(404, {
          status: 'error',
          payload: { code: 'github-repository-not-found' }
        });

      return store.dispatch(createSnaps([ repository ]))
        .then(() => {
          const errorAction = store.getActions().filter((action) => {
            return action.type === ActionTypes.CREATE_SNAP_ERROR;
          })[0];
          expect(errorAction.payload.id).toBe('foo/bar');
          expect(errorAction.payload.error.json.payload).toEqual({
            code: 'github-repository-not-found'
          });
          scope.done();
        });
    });

    context('if creating webhook succeeds', () => {
      beforeEach(() => {
        scope
          .post('/api/github/webhook', { owner: 'foo', name: 'bar' })
          .reply(201, {
            status: 'success',
            payload: { code: 'github-webhook-created' }
          });
      });

      it('stores an error on failure to create snap', () => {
        scope
          .post('/api/launchpad/snaps', { repository_url: repository.url })
          .reply(400, {
            status: 'error',
            payload: {
              'code': 'not-logged-in',
              'message': 'Not logged in'
            }
          });

        return store.dispatch(createSnaps([ repository ]))
          .then(() => {
            const errorAction = store.getActions().filter((action) => {
              return action.type === ActionTypes.CREATE_SNAP_ERROR;
            })[0];
            expect(errorAction.payload.id).toBe('foo/bar');
            expect(errorAction.payload.error.json.payload).toEqual({
              code: 'not-logged-in',
              message: 'Not logged in',
            });
            scope.done();
          });
      });

      it('creates success action if creating snap succeeds', () => {
        scope
          .post('/api/launchpad/snaps', { repository_url: repository.url })
          .reply(201, {
            status: 'success',
            payload: {
              code: 'snap-created',
              message: 'dummy-caveat'
            }
          });

        const expectedAction = {
          type: ActionTypes.CREATE_SNAP_SUCCESS,
          payload: { id: 'foo/bar' }
        };
        return store.dispatch(createSnaps([ repository ]))
          .then(() => {
            expect(store.getActions()).toInclude(expectedAction);
            scope.done();
          });
      });
    });
  });

  context('createSnapSuccess', () => {
    let id = 'foo/bar';

    beforeEach(() => {
      action = createSnapSuccess(id);
    });

    it('creates an action to store success', () => {
      const expectedAction = {
        type: ActionTypes.CREATE_SNAP_SUCCESS,
        payload: { id }
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('creates a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('createSnapError', () => {
    let error = 'Something went wrong!';
    let id = 'foo/bar';

    beforeEach(() => {
      action = createSnapError(id, error);
    });

    it('creates an action to store error on failure', () => {
      const expectedAction = {
        type: ActionTypes.CREATE_SNAP_ERROR,
        error: true,
        payload: { id, error }
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('creates a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });
});
