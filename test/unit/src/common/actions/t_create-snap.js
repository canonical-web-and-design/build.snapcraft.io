import expect from 'expect';
import { isFSA } from 'flux-standard-action';
import nock from 'nock';
import { MacaroonsBuilder } from 'macaroons.js';
import proxyquire from 'proxyquire';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { conf } from '../../../../../src/common/helpers/config';
import { makeLocalForageStub } from '../../../../helpers';

const localForageStub = makeLocalForageStub();
const createSnapModule = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/create-snap',
  { 'localforage': localForageStub }
);
const {
  createSnaps,
  createSnapError,
  createSnapSuccess,
  setGitHubRepository
} = createSnapModule;
const ActionTypes = createSnapModule;

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

  afterEach(() => {
    localForageStub.clear();
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
      scope.get('/api/github/snapcraft-yaml/foo/bar')
        .reply(200);

      return store.dispatch(createSnaps([ repository ]))
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.CREATE_SNAPS_START
          );
          scope.done();
        });
    });

    it('stores an error on failure to get snap name', () => {
      scope.get('/api/github/snapcraft-yaml/foo/bar')
        .reply(400, {
          status: 'error',
          payload: {
            code: 'snapcraft-yaml-no-name',
            message: 'snapcraft.yaml has no top-level "name" attribute'
          }
        });

      return store.dispatch(createSnaps([ repository ]))
        .then(() => {
          const errorAction = store.getActions().filter((action) => {
            return action.type === ActionTypes.CREATE_SNAP_ERROR;
          })[0];
          expect(errorAction.payload.id).toBe('foo/bar');
          expect(errorAction.payload.error.json.payload).toEqual({
            code: 'snapcraft-yaml-no-name',
            message: 'snapcraft.yaml has no top-level "name" attribute'
          });
          scope.done();
        });
    });

    context('if getting snap name succeeds', () => {
      let storeScope;
      let rootMacaroon;
      let dischargeMacaroon;

      beforeEach(() => {
        scope.get('/api/github/snapcraft-yaml/foo/bar')
          .reply(200, {
            status: 'success',
            payload: {
              code: 'snapcraft-yaml-found',
              contents: { name: 'test-snap' }
            }
          });
        storeScope = nock(conf.get('STORE_API_URL'));
        rootMacaroon = new MacaroonsBuilder('sca', 'key', 'id')
          .add_third_party_caveat('sso', '3p key', 'sso id')
          .getMacaroon();
        dischargeMacaroon = new MacaroonsBuilder('sso', '3p key', 'sso id')
          .getMacaroon();
        localForageStub.store['package_upload_request'] = {
          root: rootMacaroon.serialize(),
          discharge: dischargeMacaroon.serialize()
        };
      });

      it('stores an error on failure to get package upload macaroon', () => {
        storeScope
          .post('/acl/', {
            packages: [{ name: 'test-snap', series: '16' }],
            permissions: ['package_upload'],
            channels: ['edge']
          })
          .reply(404, {
            status: 404,
            error_code: 'resource-not-found'
          });

        return store.dispatch(createSnaps([ repository ]))
          .then(() => {
            const errorAction = store.getActions().filter((action) => {
              return action.type === ActionTypes.CREATE_SNAP_ERROR;
            })[0];
            expect(errorAction.payload.id).toBe('foo/bar');
            expect(errorAction.payload.error.json.payload).toEqual({
              code: 'snap-name-not-registered',
              message: 'Snap name is not registered in the store',
              snap_name: 'test-snap'
            });
            scope.done();
          });
      });

      context('if getting package upload macaroon succeeds', () => {
        beforeEach(() => {
          // XXX check headers and body
          storeScope.post('/acl/')
            .reply(200, { macaroon: 'dummy-package-upload-macaroon' });
        });

        it('stores an error on failure to create snap', () => {
          scope
            .post('/api/launchpad/snaps', {
              repository_url: repository.url,
              snap_name: 'test-snap',
              series: '16',
              channels: ['edge']
            })
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

        context('if creating snap succeeds', () => {
          beforeEach(() => {
            scope
              .post('/api/launchpad/snaps', {
                repository_url: repository.url,
                snap_name: 'test-snap',
                series: '16',
                channels: ['edge']
              })
              .reply(201, {
                status: 'success',
                payload: {
                  code: 'snap-created',
                  message: 'dummy-caveat'
                }
              });
          });

          it('stores an error on failure to authorize snap', () => {
            scope
              .post('/api/launchpad/snaps/authorize', {
                repository_url: repository.url,
                macaroon: 'dummy-package-upload-macaroon'
              })
              .reply(400, {
                status: 'error',
                payload: {
                  code: 'not-logged-in',
                  message: 'Not logged in'
                }
              });

            return store.dispatch(createSnaps([ repository ]))
              .then(() => {
                const errorAction = store.getActions().filter((action) => {
                  return action.type === ActionTypes.CREATE_SNAP_ERROR;
                })[0];
                expect(errorAction.payload.id).toBe('foo/bar');
                expect(errorAction.payload.error.json.payload).toEqual({
                  'code': 'not-logged-in',
                  'message': 'Not logged in'
                });
                scope.done();
              });
          });

          it('creates success action on successful creation', () => {
            scope
              .post('/api/launchpad/snaps/authorize', {
                repository_url: repository.url,
                macaroon: 'dummy-package-upload-macaroon'
              })
              .reply(204);

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
