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
import callApi from '../../../../../src/common/middleware/call-api';

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
  registerNameError,
  registerNameClear,
} = registerNameModule;
const ActionTypes = registerNameModule;

const middlewares = [ thunk, callApi({ endpoint: conf.get('BASE_URL') }) ];
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
  let storeApi;
  let action;
  let scope;
  let root;
  let discharge;

  beforeEach(() => {
    store = mockStore(initialState);
    storeApi = nock(conf.get('STORE_API_URL'));
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
    storeApi.done();
    scope.done();
    nock.cleanAll();
    localForageStub.clear();
  });

  context('internalRegisterName', () => {
    it('throws an error on failure to register snap name', async () => {
      storeApi
        .post('/register-name/', { snap_name: 'test-snap' })
        .reply(409, {
          status: 409,
          code: 'already_registered',
          detail: '\'test-snap\' is already registered.'
        });
      try {
        await internalRegisterName(root, discharge, 'test-snap');
        throw new Error('unexpected success');
      } catch (error) {
        expect(error.json.payload).toEqual({
          status: 409,
          code: 'already_registered',
          detail: '\'test-snap\' is already registered.'
        });
      }
    });

    it('succeeds if registering snap name says already owned', async () => {
      storeApi
        .post('/register-name/', { snap_name: 'test-snap' })
        .reply(409, {
          status: 409,
          code: 'already_owned',
          detail: 'You already own \'test-snap\'.'
        });
      await internalRegisterName(root, discharge, 'test-snap');
    });

    it('succeeds if registering snap name succeeds', async () => {
      // XXX check Authorization header
      storeApi
        .post('/register-name/', { snap_name: 'test-snap' })
        .reply(201, { snap_id: 'test-snap-id' });
      await internalRegisterName(root, discharge, 'test-snap');
    });
  });

  context('registerName', () => {
    it('stores a REGISTER_NAME action', async () => {
      const expectedAction = {
        type: ActionTypes.REGISTER_NAME,
        payload: { id: 'foo/bar', snapName: 'test-snap' }
      };
      await store.dispatch(registerName(repository, 'test-snap'));
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('stores an error if there is no package upload request ' +
       'macaroon', async () => {
      await store.dispatch(registerName(repository, 'test-snap'));
      const errorAction = store.getActions().filter((action) => {
        return action.type === ActionTypes.REGISTER_NAME_ERROR;
      })[0];
      expect(errorAction.payload.id).toBe('foo/bar');
      expect(errorAction.payload.error.json.payload).toEqual({
        code: 'not-logged-into-store',
        message: 'Not logged into store',
        detail: 'No package_upload_request macaroons in local storage'
      });
    });

    context('if there is a package upload request macaroon', () => {
      beforeEach(() => {
        localForageStub.store['package_upload_request'] = { root, discharge };
      });

      it('stores an error if signing agreement and that fails', async () => {
        const error = {
          code: 'internal-server-error',
          message: 'Internal server error'
        };
        storeApi
          .post('/agreement/', { latest_tos_accepted: true })
          .reply(500, { error_list: [error] });
        await store.dispatch(registerName(repository, 'test-snap', {
          signAgreement: 'test-user'
        }));
        const errorAction = store.getActions().filter((action) => {
          return action.type === ActionTypes.REGISTER_NAME_ERROR;
        })[0];
        expect(errorAction.payload.id).toBe('foo/bar');
        expect(errorAction.payload.error.json.payload).toEqual(error);
      });

      it('stores an error on failure to register snap name', async () => {
        storeApi
          .post('/register-name/', { snap_name: 'test-snap' })
          .reply(409, {
            status: 409,
            code: 'already_registered',
            detail: '\'test-snap\' is already registered.'
          });
        await store.dispatch(registerName(repository, 'test-snap'));
        const errorAction = store.getActions().filter((action) => {
          return action.type === ActionTypes.REGISTER_NAME_ERROR;
        })[0];
        expect(errorAction.payload.id).toBe('foo/bar');
        expect(errorAction.payload.error.json.payload).toEqual({
          status: 409,
          code: 'already_registered',
          detail: '\'test-snap\' is already registered.'
        });
      });

      context('if registering snap name succeeds', () => {
        beforeEach(() => {
          // XXX check Authorization header
          storeApi
            .post('/register-name/', { snap_name: 'test-snap' })
            .reply(201, { snap_id: 'test-snap-id' });
        });

        afterEach(() => {
          storeApi.done();
        });

        it('stores an error on failure to get package upload ' +
           'macaroon', async () => {
          storeApi
            .post('/acl/', {
              packages: [{ name: 'test-snap', series: '16' }],
              permissions: ['package_upload'],
              channels: ['edge']
            })
            .reply(404, {
              status: 404,
              error_code: 'resource-not-found'
            });

          await store.dispatch(registerName(repository, 'test-snap'));
          const errorAction = store.getActions().filter((action) => {
            return action.type === ActionTypes.REGISTER_NAME_ERROR;
          })[0];
          expect(errorAction.payload.id).toBe('foo/bar');
          expect(errorAction.payload.error.json.payload).toEqual({
            code: 'snap-name-not-registered',
            message: 'Snap name is not registered in the store',
            snap_name: 'test-snap'
          });
        });

        context('if getting package upload macaroon succeeds', () => {
          beforeEach(() => {
            // XXX check headers and body
            storeApi.post('/acl/')
              .reply(200, { macaroon: 'dummy-package-upload-macaroon' });
          });

          it('stores an error on failure to authorize snap', async () => {
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

            await store.dispatch(registerName(repository, 'test-snap'));
            const errorAction = store.getActions().filter((action) => {
              return action.type === ActionTypes.REGISTER_NAME_ERROR;
            })[0];
            expect(errorAction.payload.id).toBe('foo/bar');
            expect(errorAction.payload.error.json.payload).toEqual({
              'code': 'not-logged-in',
              'message': 'Not logged in'
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

            it('creates success action if not requesting builds', async () => {
              await store.dispatch(registerName(repository, 'test-snap'));
              expect(store.getActions()).toInclude(expectedAction);
            });

            context('if requesting builds', () => {
              it('stores success and error actions if requesting builds ' +
                 'fails', async () => {
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

                await store.dispatch(registerName(repository, 'test-snap', {
                  requestBuilds: true
                }));
                const actions = store.getActions();
                expect(actions).toInclude(expectedAction);
                expect(actions).toHaveActionOfType(FETCH_BUILDS_ERROR);
              });

              it('stores success actions if requesting builds ' +
                 'succeeds', async () => {
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

                await store.dispatch(registerName(repository, 'test-snap', {
                  requestBuilds: true
                }));
                const actions = store.getActions();
                expect(actions).toInclude(expectedAction);
                expect(actions).toHaveActionOfType(FETCH_BUILDS_SUCCESS);
              });
            });

            context('if signing agreement and that succeeds', () => {
              beforeEach(() => {
                storeApi
                  .post('/agreement/', { latest_tos_accepted: true })
                  .reply(200, { latest_tos_accepted: true });
              });

              it('sets short namespace if unset', async () => {
                const error = {
                  code: 'user-not-ready',
                  message: 'Developer profile is missing short namespace.'
                };
                storeApi
                  .get('/account')
                  .query(true)
                  .reply(403, { error_list: [error] })
                  .patch('/account', {
                    short_namespace: 'test-user'
                  })
                  .reply(204);
                storeApi
                  .get('/account')
                  .query(true)
                  .reply(200, {});

                const expectedAccountAction = {
                  type: GET_ACCOUNT_INFO_SUCCESS,
                  payload: {
                    signedAgreement: true,
                    hasShortNamespace: true,
                    registeredNames: null
                  }
                };
                await store.dispatch(registerName(repository, 'test-snap', {
                  signAgreement: 'test-user'
                }));
                const actions = store.getActions();
                expect(actions).toInclude(expectedAccountAction);
                expect(actions).toInclude(expectedAction);
              });

              it('leaves short namespace alone if already set', async () => {
                storeApi
                  .get('/account')
                  .query(true)
                  .reply(200, {});

                const expectedAccountAction = {
                  type: GET_ACCOUNT_INFO_SUCCESS,
                  payload: {
                    signedAgreement: true,
                    hasShortNamespace: true,
                    registeredNames: null
                  }
                };
                await store.dispatch(registerName(repository, 'test-snap', {
                  signAgreement: 'test-user'
                }));
                const actions = store.getActions();
                expect(actions).toInclude(expectedAccountAction);
                expect(actions).toInclude(expectedAction);
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

  context('registerNameClear', () => {
    let id = 'foo/bar';

    beforeEach(() => {
      action = registerNameClear(id);
    });

    it('creates an action to clear register name entry', () => {
      const expectedAction = {
        type: ActionTypes.REGISTER_NAME_CLEAR,
        payload: { id }
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('creates a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });
});
