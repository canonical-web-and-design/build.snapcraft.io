import expect from 'expect';
import nock from 'nock';
import { MacaroonsBuilder } from 'macaroons.js';
import proxyquire from 'proxyquire';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import url from 'url';

import { conf } from '../../../../../src/common/helpers/config';
import { makeLocalForageStub } from '../../../../helpers';
import callApi from '../../../../../src/common/middleware/call-api';

const localForageStub = makeLocalForageStub();
const registerNameModule = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/register-name',
  {
    'localforage': localForageStub,
  }
);
const nameOwnershipModule = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/name-ownership',
  {
    './register-name': { ...registerNameModule }
  }
);

const {
  internalNameOwnership,
  checkNameOwnership,

  NAME_OWNERSHIP_NOT_REGISTERED,
  NAME_OWNERSHIP_ALREADY_OWNED,
  NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER
} = nameOwnershipModule;

const ActionTypes = nameOwnershipModule;

const middlewares = [ thunk, callApi({ endpoint: conf.get('BASE_URL') }) ];
const mockStore = configureMockStore(middlewares);

describe('name ownership actions', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null
  };

  let store;
  let storeApi;
  let root;
  let discharge;

  beforeEach(() => {
    store = mockStore(initialState);
    storeApi = nock(conf.get('STORE_API_URL'));
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
    nock.cleanAll();
    localForageStub.clear();
  });

  context('internalNameOwnership', () => {

    context('when given snap name is not registered in the store', () => {
      let api;
      const snapName = 'test-snap';

      beforeEach(() => {
        api = storeApi
          .post('/acl/', {
            packages: [{ name: snapName }],
            permissions: ['package_upload']
          })
          .reply(400, { status: 'error' });
      });

      afterEach(() => {
        api.done();
        nock.cleanAll();
      });

      it('should return NAME_OWNERSHIP_NOT_REGISTERED status code', async () => {
        const status = await internalNameOwnership(root, discharge, snapName);

        expect(status).toBe(NAME_OWNERSHIP_NOT_REGISTERED);
      });
    });

    context('when given snap name is registered by current user', () => {

      const snapName = 'test-snap';

      beforeEach(() => {
        storeApi
          .post('/acl/', {
            packages: [{ name: snapName }],
            permissions: ['package_upload']
          })
          .reply(200, { macaroon: 'test-macaroon' });
        storeApi
          .post('/register-name/', { snap_name: snapName })
          .reply(409, { code: 'already_owned' });
      });

      afterEach(() => {
        storeApi.done();
        nock.cleanAll();
      });

      it('should return NAME_OWNERSHIP_ALREADY_OWNED status code', async () => {
        const status = await internalNameOwnership(root, discharge, snapName);

        expect(status).toBe(NAME_OWNERSHIP_ALREADY_OWNED);
      });
    });

    context('when given snap name is registered by another user', () => {

      const snapName = 'test-snap';

      beforeEach(() => {
        storeApi
          .post('/acl/', {
            packages: [{ name: snapName }],
            permissions: ['package_upload']
          })
          .reply(200, { macaroon: 'test-macaroon' });
        storeApi
          .post('/register-name/', { snap_name: snapName })
          .reply(409, { code: 'already_registered' });
      });

      afterEach(() => {
        storeApi.done();
        nock.cleanAll();
      });

      it('should return NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER status code', async () => {
        const status = await internalNameOwnership(root, discharge, snapName);

        expect(status).toBe(NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER);
      });
    });

    context('when given snap name is registered by another user', () => {

      const snapName = 'test-snap';

      beforeEach(() => {
        storeApi
          .post('/acl/', {
            packages: [{ name: snapName }],
            permissions: ['package_upload']
          })
          .reply(200, { macaroon: 'test-macaroon' });
        storeApi
          .post('/register-name/', { snap_name: snapName })
          .reply(200, { status: 'success' });
      });

      afterEach(() => {
        storeApi.done();
        nock.cleanAll();
      });

      it('should throw an error with "unexpected-register-response" code', async () => {
        try {
          await internalNameOwnership(root, discharge, snapName);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.json).toInclude({
            code: 'unexpected-register-response'
          });
        }
      });
    });
  });

  context('checkNameOwnership', () => {
    const name = 'test-snap';

    beforeEach(() => {
      localForageStub.store['package_upload_request'] = { root, discharge };
    });

    context('when snapName is not specified', () => {
      it('should throw an error', async () => {
        try {
          await store.dispatch(checkNameOwnership(''));
          throw new Error('Unexpected success');
        } catch (error) {
          expect(error.message).toContain('`name` is required param');
        }
      });
    });

    context('when name ownership successfully verified', () => {
      beforeEach(() => {
        storeApi
          .post('/acl/', {
            packages: [{ name }],
            permissions: ['package_upload']
          })
          .reply(404, {
            status: 404,
            error_code: 'resource-not-found'
          });
      });

      afterEach(() => {
        storeApi.done();
        nock.cleanAll();
      });

      it('should store CHECK_NAME_OWNERSHIP_REQUEST action', async() => {
        const expectedAction = {
          type: ActionTypes.CHECK_NAME_OWNERSHIP_REQUEST,
          payload: { name }
        };
        await store.dispatch(checkNameOwnership(name));
        expect(store.getActions()).toInclude(expectedAction);
      });


      it('should store CHECK_NAME_OWNERSHIP_SUCCESS action', async() => {
        const expectedAction = {
          type: ActionTypes.CHECK_NAME_OWNERSHIP_SUCCESS,
          payload: {
            name,
            status: NAME_OWNERSHIP_NOT_REGISTERED
          }
        };
        await store.dispatch(checkNameOwnership(name));
        expect(store.getActions()).toInclude(expectedAction);
      });

    });

    context('when name ownership thrown an error', () => {
      beforeEach(() => {
        storeApi
          .post('/acl/', {
            packages: [{ name }],
            permissions: ['package_upload']
          })
          .reply(500, '<html>ERROR!</html>');
      });

      afterEach(() => {
        storeApi.done();
        nock.cleanAll();
      });

      it('should store CHECK_NAME_OWNERSHIP_REQUEST action', async() => {
        const expectedAction = {
          type: ActionTypes.CHECK_NAME_OWNERSHIP_REQUEST,
          payload: { name }
        };
        await store.dispatch(checkNameOwnership(name));
        expect(store.getActions()).toInclude(expectedAction);
      });

      it('should store CHECK_NAME_OWNERSHIP_ERROR action', async() => {
        await store.dispatch(checkNameOwnership(name));
        expect(store.getActions()).toHaveActionsMatching((action) => {
          return action.type === ActionTypes.CHECK_NAME_OWNERSHIP_ERROR &&
            action.payload.name === name;
        });
      });

    });
  });
});
