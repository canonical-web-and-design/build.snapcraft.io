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
const registerNameModule = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/register-name',
  { 'localforage': localForageStub }
);
const {
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

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  afterEach(() => {
    localForageStub.clear();
  });

  context('registerName', () => {
    const BASE_URL = conf.get('BASE_URL');
    let scope;
    let root;
    let discharge;

    beforeEach(() => {
      scope = nock(BASE_URL);
      const rootMacaroon = new MacaroonsBuilder('sca', 'key', 'id')
        .add_third_party_caveat('sso', '3p key', 'sso id')
        .getMacaroon();
      const dischargeMacaroon = new MacaroonsBuilder('sso', '3p key', 'sso id')
        .getMacaroon();
      root = rootMacaroon.serialize();
      discharge = dischargeMacaroon.serialize();
      localForageStub.store['package_upload_request'] = { root, discharge };
    });

    afterEach(() => {
      nock.cleanAll();
    });

    context('if registering snap name fails', () => {
      beforeEach(() => {
        scope
          .post('/api/store/register-name', { snap_name: 'test-snap' })
          .reply(409, {
            status: 409,
            code: 'already_registered',
            detail: '\'test-snap\' is already registered.'
          });
      });

      it('stores an error', () => {
        return store.dispatch(registerName('foo/bar', 'test-snap'))
          .then(() => {
            const errorAction = store.getActions().filter((action) => {
              return action.type === ActionTypes.REGISTER_NAME_ERROR;
            })[0];
            expect(errorAction.payload.id).toBe('foo/bar');
            expect(errorAction.payload.error.json).toEqual({
              status: 409,
              code: 'already_registered',
              detail: '\'test-snap\' is already registered.'
            });
            scope.done();
          });
      });
    });

    context('if registering snap name says already owned', () => {
      beforeEach(() => {
        scope
          .post('/api/store/register-name', { snap_name: 'test-snap' })
          .reply(409, {
            status: 409,
            code: 'already_owned',
            detail: 'You already own \'test-snap\'.'
          });
      });

      it('stores a REGISTER_NAME action', () => {
        const expectedAction = {
          type: ActionTypes.REGISTER_NAME,
          payload: { id: 'foo/bar', snapName: 'test-snap' }
        };
        return store.dispatch(registerName('foo/bar', 'test-snap'))
          .then(() => {
            expect(store.getActions()).toInclude(expectedAction);
            scope.done();
          });
      });

      it('creates success action', () => {
        const expectedAction = {
          type: ActionTypes.REGISTER_NAME_SUCCESS,
          payload: { id: 'foo/bar' }
        };
        return store.dispatch(registerName('foo/bar', 'test-snap'))
          .then(() => {
            expect(store.getActions()).toInclude(expectedAction);
            scope.done();
          });
      });
    });

    context('if registering snap name succeeds', () => {
      beforeEach(() => {
        // XXX check Authorization header
        scope
          .post('/api/store/register-name', { snap_name: 'test-snap' })
          .reply(201, { snap_id: 'test-snap-id' });
      });

      it('stores a REGISTER_NAME action', () => {
        const expectedAction = {
          type: ActionTypes.REGISTER_NAME,
          payload: { id: 'foo/bar', snapName: 'test-snap' }
        };
        return store.dispatch(registerName('foo/bar', 'test-snap'))
          .then(() => {
            expect(store.getActions()).toInclude(expectedAction);
            scope.done();
          });
      });

      it('creates success action', () => {
        const expectedAction = {
          type: ActionTypes.REGISTER_NAME_SUCCESS,
          payload: { id: 'foo/bar' }
        };
        return store.dispatch(registerName('foo/bar', 'test-snap'))
          .then(() => {
            expect(store.getActions()).toInclude(expectedAction);
            scope.done();
          });
      });
    });
  });

  context('registerNameSuccess', () => {
    let id = 'foo/bar';

    beforeEach(() => {
      action = registerNameSuccess(id);
    });

    it('creates an action to store success', () => {
      const expectedAction = {
        type: ActionTypes.REGISTER_NAME_SUCCESS,
        payload: { id }
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
