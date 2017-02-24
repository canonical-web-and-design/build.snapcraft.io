import expect from 'expect';
import { isFSA } from 'flux-standard-action';
import nock from 'nock';
import { MacaroonsBuilder } from 'macaroons.js';
import proxyquire from 'proxyquire';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import url from 'url';

import {
  GET_ACCOUNT_INFO_SUCCESS
} from '../../../../../src/common/actions/auth-store';
import {
  FETCH_BUILDS_ERROR,
  FETCH_BUILDS_SUCCESS
} from '../../../../../src/common/actions/snap-builds';
import { conf } from '../../../../../src/common/helpers/config';
import { makeLocalForageStub } from '../../../../helpers';

const localForageStub = makeLocalForageStub();
const getAccountInfo = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/auth-store',
  { 'localforage': localForageStub }
).getAccountInfo;
const registerNameModule = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/register-name',
  {
    'localforage': localForageStub,
    './auth-store': { getAccountInfo, '@noCallThru': false }
  }
);
const {
  internalRegisterName,
  registerName,
  registerNameSuccess,
  registerNameError
} = registerNameModule;
const ActionTypes = registerNameModule;

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('register name actions', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null
  };
  const repository = {
    url: 'https://github.com/foo/bar',
    fullName: 'foo/bar'
  };
  const BASE_URL = conf.get('BASE_URL');

  let store;
  let action;
  let scope;
  let root;
  let discharge;

  beforeEach(() => {
    store = mockStore(initialState);
    scope = nock(BASE_URL);
    const ssoLocation = url.parse(conf.get('UBUNTU_SSO_URL')).host;
    const rootMacaroon = new MacaroonsBuilder('location', 'key', 'id')
      .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
      .getMacaroon();
    const dischargeMacaroon = MacaroonsBuilder.create(
      ssoLocation, 'sso key', 'sso caveat'
    );
    root = rootMacaroon.serialize();
    discharge = dischargeMacaroon.serialize();
  });

  afterEach(() => {
    nock.cleanAll();
    localForageStub.clear();
  });

  context('internalRegisterName', () => {
    it('throws an error on failure to register snap name', () => {
      scope
        .post('/api/store/register-name', { snap_name: 'test-snap' })
        .reply(409, {
          status: 409,
          code: 'already_registered',
          detail: '\'test-snap\' is already registered.'
        });
      return internalRegisterName(root, discharge, 'test-snap')
        .then(() => { throw new Error('unexpected success'); })
        .catch((error) => {
          scope.done();
          expect(error.json.payload).toEqual({
            status: 409,
            code: 'already_registered',
            detail: '\'test-snap\' is already registered.'
          });
        });
    });

    it('succeeds if registering snap name says already owned', () => {
      scope
        .post('/api/store/register-name', { snap_name: 'test-snap' })
        .reply(409, {
          status: 409,
          code: 'already_owned',
          detail: 'You already own \'test-snap\'.'
        });
      return internalRegisterName(root, discharge, 'test-snap')
        .then(() => scope.done());
    });

    it('succeeds if registering snap name succeeds', () => {
      // XXX check Authorization header
      scope
        .post('/api/store/register-name', { snap_name: 'test-snap' })
        .reply(201, { snap_id: 'test-snap-id' });
      return internalRegisterName(root, discharge, 'test-snap')
        .then(() => scope.done());
    });
  });

  context('registerName', () => {
    it('stores a REGISTER_NAME action', () => {
      const expectedAction = {
        type: ActionTypes.REGISTER_NAME,
        payload: { id: 'foo/bar', snapName: 'test-snap' }
      };
      return store.dispatch(registerName(repository, 'test-snap'))
        .then(() => {
          expect(store.getActions()).toInclude(expectedAction);
          scope.done();
        });
    });

    it('stores an error if there is no package upload request ' +
       'macaroon', () => {
      return store.dispatch(registerName(repository, 'test-snap'))
        .then(() => {
          const errorAction = store.getActions().filter((action) => {
            return action.type === ActionTypes.REGISTER_NAME_ERROR;
          })[0];
          expect(errorAction.payload.id).toBe('foo/bar');
          expect(errorAction.payload.error.json.payload).toEqual({
            code: 'not-logged-into-store',
            message: 'Not logged into store',
            detail: 'No package_upload_request macaroons in local storage'
          });
          scope.done();
        });
    });

    context('if there is a package upload request macaroon', () => {
      beforeEach(() => {
        localForageStub.store['package_upload_request'] = { root, discharge };
      });

      it('stores an error if signing agreement and that fails', () => {
        const error = {
          code: 'internal-server-error',
          message: 'Internal server error'
        };
        scope
          .post('/api/store/agreement', { latest_tos_accepted: true })
          .reply(500, { error_list: [error] });
        return store.dispatch(registerName(repository, 'test-snap', {
          signAgreement: 'test-user'
        })).then(() => {
          const errorAction = store.getActions().filter((action) => {
            return action.type === ActionTypes.REGISTER_NAME_ERROR;
          })[0];
          expect(errorAction.payload.id).toBe('foo/bar');
          expect(errorAction.payload.error.json.payload).toEqual(error);
          scope.done();
        });
      });

      it('stores an error on failure to register snap name', () => {
        scope
          .post('/api/store/register-name', { snap_name: 'test-snap' })
          .reply(409, {
            status: 409,
            code: 'already_registered',
            detail: '\'test-snap\' is already registered.'
          });
        return store.dispatch(registerName(repository, 'test-snap'))
          .then(() => {
            const errorAction = store.getActions().filter((action) => {
              return action.type === ActionTypes.REGISTER_NAME_ERROR;
            })[0];
            expect(errorAction.payload.id).toBe('foo/bar');
            expect(errorAction.payload.error.json.payload).toEqual({
              status: 409,
              code: 'already_registered',
              detail: '\'test-snap\' is already registered.'
            });
            scope.done();
          });
      });

      context('if registering snap name succeeds', () => {
        let storeScope;

        beforeEach(() => {
          // XXX check Authorization header
          scope
            .post('/api/store/register-name', { snap_name: 'test-snap' })
            .reply(201, { snap_id: 'test-snap-id' });
          storeScope = nock(conf.get('STORE_API_URL'));
        });

        it('stores an error on failure to get package upload ' +
           'macaroon', () => {
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

          return store.dispatch(registerName(repository, 'test-snap'))
            .then(() => {
              const errorAction = store.getActions().filter((action) => {
                return action.type === ActionTypes.REGISTER_NAME_ERROR;
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

          it('stores an error on failure to authorize snap', () => {
            scope
              .post('/api/launchpad/snaps/authorize', {
                repository_url: repository.url,
                snap_name: 'test-snap',
                series: '16',
                channels: ['edge'],
                macaroon: 'dummy-package-upload-macaroon'
              })
              .reply(400, {
                status: 'error',
                payload: {
                  code: 'not-logged-in',
                  message: 'Not logged in'
                }
              });

            return store.dispatch(registerName(repository, 'test-snap'))
              .then(() => {
                const errorAction = store.getActions().filter((action) => {
                  return action.type === ActionTypes.REGISTER_NAME_ERROR;
                })[0];
                expect(errorAction.payload.id).toBe('foo/bar');
                expect(errorAction.payload.error.json.payload).toEqual({
                  'code': 'not-logged-in',
                  'message': 'Not logged in'
                });
                scope.done();
              });
          });

          context('if authorizing snap succeeds', () => {
            const expectedAction = {
              type: ActionTypes.REGISTER_NAME_SUCCESS,
              payload: { id: 'foo/bar', snapName: 'test-snap' }
            };

            beforeEach(() => {
              scope
                .post('/api/launchpad/snaps/authorize', {
                  repository_url: repository.url,
                  snap_name: 'test-snap',
                  series: '16',
                  channels: ['edge'],
                  macaroon: 'dummy-package-upload-macaroon'
                })
                .reply(204);
            });

            it('creates success action if not requesting builds', () => {
              return store.dispatch(registerName(repository, 'test-snap'))
                .then(() => {
                  expect(store.getActions()).toInclude(expectedAction);
                  scope.done();
                });
            });

            context('if requesting builds', () => {
              it('stores success and error actions if requesting builds ' +
                 'fails', () => {
                scope
                  .post('/api/launchpad/snaps/request-builds', {
                    repository_url: repository.url
                  })
                  .reply(404, {
                    status: 'error',
                    payload: {
                      code: 'lp-error',
                      message: 'Something went wrong'
                    }
                  });

                return store.dispatch(registerName(repository, 'test-snap', {
                  requestBuilds: true
                }))
                  .then(() => {
                    const actions = store.getActions();
                    expect(actions).toInclude(expectedAction);
                    expect(actions).toHaveActionOfType(FETCH_BUILDS_ERROR);
                    scope.done();
                  });
              });

              it('stores success actions if requesting builds ' +
                 'succeeds', () => {
                scope
                  .post('/api/launchpad/snaps/request-builds', {
                    repository_url: repository.url
                  })
                  .reply(201, {
                    status: 'success',
                    payload: {
                      code: 'snap-builds-requested',
                      builds: []
                    }
                  });

                return store.dispatch(registerName(repository, 'test-snap', {
                  requestBuilds: true
                }))
                  .then(() => {
                    const actions = store.getActions();
                    expect(actions).toInclude(expectedAction);
                    expect(actions).toHaveActionOfType(FETCH_BUILDS_SUCCESS);
                    scope.done();
                  });
              });
            });

            context('if signing agreement and that succeeds', () => {
              beforeEach(() => {
                scope
                  .post('/api/store/agreement', { latest_tos_accepted: true })
                  .reply(200, { latest_tos_accepted: true });
              });

              it('sets short namespace if unset', () => {
                const error = {
                  code: 'user-not-ready',
                  message: 'Developer profile is missing short namespace.'
                };
                scope
                  .get('/api/store/account')
                  .query(true)
                  .reply(403, { error_list: [error] });
                scope
                  .patch('/api/store/account', {
                    short_namespace: 'test-user'
                  })
                  .reply(204);
                scope
                  .get('/api/store/account')
                  .query(true)
                  .reply(200, {});

                const expectedAccountAction = {
                  type: GET_ACCOUNT_INFO_SUCCESS,
                  payload: { signedAgreement: true, hasShortNamespace: true }
                };
                return store.dispatch(registerName(repository, 'test-snap', {
                  signAgreement: 'test-user'
                }))
                  .then(() => {
                    const actions = store.getActions();
                    expect(actions).toInclude(expectedAccountAction);
                    expect(actions).toInclude(expectedAction);
                    scope.done();
                  });
              });

              it('leaves short namespace alone if already set', () => {
                scope
                  .get('/api/store/account')
                  .query(true)
                  .reply(200, {});

                const expectedAccountAction = {
                  type: GET_ACCOUNT_INFO_SUCCESS,
                  payload: { signedAgreement: true, hasShortNamespace: true }
                };
                return store.dispatch(registerName(repository, 'test-snap', {
                  signAgreement: 'test-user'
                }))
                  .then(() => {
                    const actions = store.getActions();
                    expect(actions).toInclude(expectedAccountAction);
                    expect(actions).toInclude(expectedAction);
                    scope.done();
                  });
              });
            });
          });
        });
      });
    });
  });

  context('registerNameSuccess', () => {
    let id = 'foo/bar';
    let snapName = 'foo-bar';

    beforeEach(() => {
      action = registerNameSuccess(id, snapName);
    });

    it('creates an action to store success', () => {
      const expectedAction = {
        type: ActionTypes.REGISTER_NAME_SUCCESS,
        payload: { id, snapName }
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('creates a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('registerNameError', () => {
    let error = 'Something went wrong!';
    let id = 'foo/bar';

    beforeEach(() => {
      action = registerNameError(id, error);
    });

    it('creates an action to store error on failure', () => {
      const expectedAction = {
        type: ActionTypes.REGISTER_NAME_ERROR,
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
