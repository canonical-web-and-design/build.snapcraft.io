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

    it('stores a CREATE_SNAPS_START action', () => {
      return store.dispatch(createSnaps([ repository ]))
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.CREATE_SNAPS_START
          );
          scope.done();
        });
    });

    context('if getting snap name succeeds', () => {
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
