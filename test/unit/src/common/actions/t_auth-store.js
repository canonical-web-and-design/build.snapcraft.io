import expect from 'expect';
import { MacaroonsBuilder } from 'macaroons.js';
import nock from 'nock';
import proxyquire from 'proxyquire';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import url from 'url';

import { conf } from '../../../../../src/common/helpers/config';
import { makeLocalForageStub } from '../../../../helpers';

const localForageStub = makeLocalForageStub();
const authStoreModule = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/auth-store',
  { 'localforage': localForageStub }
);
const {
  extractSSOCaveat,
  getCaveats,
  getSSODischarge
} = authStoreModule;
const ActionTypes = authStoreModule;

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('store authentication actions', () => {
  const initialState = {
    isFetching: false,
    hasDischarge: false,
    authenticated: false,
    error: null
  };
  const ssoLocation = url.parse(conf.get('UBUNTU_SSO_URL')).host;

  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('getCaveats', () => {
    it('generates a sequence of caveats', () => {
      const macaroon = new MacaroonsBuilder('location', 'key', 'id')
        .add_first_party_caveat('caveat 1')
        .add_third_party_caveat('external', 'external key', 'caveat 2')
        .add_first_party_caveat('caveat 3')
        .getMacaroon();
      const caveats = [];
      for (const caveat of getCaveats(macaroon)) {
        caveats.push(caveat);
      }
      expect(caveats).toMatch([
        {
          caveatId: 'caveat 1',
          verificationKeyId: '',
          location: ''
        },
        {
          caveatId: 'caveat 2',
          verificationKeyId: /./,
          location: 'external'
        },
        {
          caveatId: 'caveat 3',
          verificationKeyId: '',
          location: ''
        }
      ]);
    });
  });

  context('extractSSOCaveat', () => {
    it('returns the ID of a single SSO caveat', () => {
      const macaroon = new MacaroonsBuilder('location', 'key', 'id')
        .add_first_party_caveat('dummy')
        .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
        .getMacaroon();
      expect(extractSSOCaveat(macaroon)).toEqual('sso caveat');
    });

    it('fails if macaroon has no SSO caveats', () => {
      const macaroon = MacaroonsBuilder.create('location', 'key', 'id');
      expect(() => extractSSOCaveat(macaroon))
        .toThrow('Macaroon has no SSO caveats.');
    });

    it('fails if macaroon has multiple SSO caveats', () => {
      const macaroon = new MacaroonsBuilder('location', 'key', 'id')
        .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
        .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat 2')
        .getMacaroon();
      expect(() => extractSSOCaveat(macaroon))
        .toThrow('Macaroon has multiple SSO caveats.');
    });
  });

  context('getSSODischarge', () => {
    let api;

    beforeEach(() => {
      api = nock(conf.get('BASE_URL'));
    });

    afterEach(() => {
      nock.cleanAll();
      localForageStub.clear();
    });

    context('when GET request fails', () => {
      beforeEach(() => {
        api.get('/login/sso-discharge')
          .reply(404, {
            status: 'error',
            payload: {
              code: 'discharge-not-found',
              message: 'No SSO discharge macaroon stored'
            }
          });
      });

      it('stores an error', () => {
        const expectedMessage = 'No SSO discharge macaroon stored';

        return store.dispatch(getSSODischarge())
          .then(() => {
            api.done();
            const action = store.getActions().filter(
              (a) => a.type === ActionTypes.GET_SSO_DISCHARGE_ERROR)[0];
            expect(action.payload.message).toBe(expectedMessage);
          });
      });
    });

    context('when local storage does not contain root macaroon', () => {
      beforeEach(() => {
        api.get('/login/sso-discharge')
          .reply(200, {
            status: 'success',
            payload: {
              code: 'discharge-found',
              discharge: 'dummy'
            }
          });
      });

      it('stores an error', () => {
        const expectedMessage = 'No store root macaroon saved in local ' +
                                'storage.';

        return store.dispatch(getSSODischarge())
          .then(() => {
            api.done();
            const action = store.getActions().filter(
              (a) => a.type === ActionTypes.GET_SSO_DISCHARGE_ERROR)[0];
            expect(action.payload.message).toBe(expectedMessage);
          });
      });
    });

    context('when local storage contains mismatching root macaroon', () => {
      let root;
      let discharge;

      beforeEach(() => {
        root = new MacaroonsBuilder('location', 'key', 'id')
          .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
          .getMacaroon();
        discharge = MacaroonsBuilder.create(ssoLocation, 'wrong', 'wrong');
        localForageStub.store['package_upload_request'] = {
          root: root.serialize()
        };
        api.get('/login/sso-discharge')
          .reply(200, {
            status: 'success',
            payload: {
              code: 'discharge-found',
              discharge: discharge.serialize()
            }
          });
      });

      it('stores an error', () => {
        const expectedMessage = 'SSO discharge macaroon does not match ' +
                                'store root macaroon.';

        return store.dispatch(getSSODischarge())
          .then(() => {
            api.done();
            const action = store.getActions().filter(
              (a) => a.type === ActionTypes.GET_SSO_DISCHARGE_ERROR)[0];
            expect(action.payload.message).toBe(expectedMessage);
          });
      });
    });

    context('when local storage contains matching root macaroon', () => {
      let root;
      let discharge;

      beforeEach(() => {
        root = new MacaroonsBuilder('location', 'key', 'id')
          .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
          .getMacaroon();
        discharge = MacaroonsBuilder.create(
          ssoLocation, 'sso key', 'sso caveat'
        );
        localForageStub.store['package_upload_request'] = {
          root: root.serialize()
        };
        api.get('/login/sso-discharge')
          .reply(200, {
            status: 'success',
            payload: {
              code: 'discharge-found',
              discharge: discharge.serialize()
            }
          });
        api.delete('/login/sso-discharge')
          .reply(204);
      });

      it('creates a success action', () => {
        return store.dispatch(getSSODischarge())
          .then(() => {
            api.done();
            expect(store.getActions()).toHaveActionOfType(
              ActionTypes.GET_SSO_DISCHARGE_SUCCESS
            );
          });
      });
    });
  });
});
