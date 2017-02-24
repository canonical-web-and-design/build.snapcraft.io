import expect from 'expect';
import { MacaroonsBuilder } from 'macaroons.js';
import moment from 'moment';
import nock from 'nock';
import proxyquire from 'proxyquire';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import tmatch from 'tmatch';
import url from 'url';

import { conf } from '../../../../../src/common/helpers/config';
import { makeLocalForageStub } from '../../../../helpers';

const localForageStub = makeLocalForageStub();
const getPackageUploadRequestMacaroon = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/register-name',
  { 'localforage': localForageStub }
).getPackageUploadRequestMacaroon;
const authStoreModule = proxyquire.noCallThru().load(
  '../../../../../src/common/actions/auth-store',
  {
    'localforage': localForageStub,
    './register-name': { getPackageUploadRequestMacaroon }
  }
);
const {
  checkSignedIntoStore,
  extractExpiresCaveat,
  extractSSOCaveat,
  getAccountInfo,
  getCaveats,
  getSSODischarge,
  signAgreementSuccess,
  signIntoStore,
  signOut
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

  context('extractExpiresCaveat', () => {
    const storeLocation = url.parse(conf.get('STORE_API_URL')).host;

    it('parses an expires caveat', () => {
      const expires = '2017-01-01T00:00:00.000';
      const macaroon = new MacaroonsBuilder('location', 'key', 'id')
        .add_first_party_caveat(`${storeLocation}|expires|${expires}`)
        .getMacaroon();
      expect(extractExpiresCaveat(macaroon)).toEqual(moment(expires));
    });

    it('skips expires caveats from wrong host', () => {
      const expires = '2017-01-01T00:00:00.000';
      const macaroon = new MacaroonsBuilder('location', 'key', 'id')
        .add_first_party_caveat(`wrong|expires|${expires}`)
        .getMacaroon();
      expect(extractExpiresCaveat(macaroon)).toBe(undefined);
    });

    it('skips non-expires caveats', () => {
      const macaroon = new MacaroonsBuilder('location', 'key', 'id')
        .add_first_party_caveat(`${storeLocation}|channel|["edge"]`)
        .getMacaroon();
      expect(extractExpiresCaveat(macaroon)).toBe(undefined);
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

    context('when local storage contains expired root macaroon', () => {
      const storeLocation = url.parse(conf.get('STORE_API_URL')).host;
      let root;
      let discharge;

      beforeEach(() => {
        const expires = moment()
          .subtract(1, 'seconds')
          .format('YYYY-MM-DD[T]HH:mm:ss.SSS');
        root = new MacaroonsBuilder(storeLocation, 'key', 'id')
          .add_first_party_caveat(`${storeLocation}|expires|${expires}`)
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
        const expectedMessage = 'Store root macaroon has expired.';

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

  context('signIntoStore', () => {
    let storeApi;

    beforeEach(() => {
      storeApi = nock(conf.get('STORE_API_URL'));
    });

    afterEach(() => {
      nock.cleanAll();
      localForageStub.clear();
    });

    context('when store request fails', () => {
      beforeEach(() => {
        storeApi.post('/acl/')
          .reply(400, {
            status: 404,
            error_code: 'something-went-wrong'
          });
      });

      it('stores an error', () => {
        const expectedMessage = 'The store did not return a valid macaroon.';

        const location = {};
        return store.dispatch(signIntoStore(location))
          .then(() => {
            expect(location).toExcludeKey('href');
            storeApi.done();
            const action = store.getActions().filter(
              (a) => a.type === ActionTypes.SIGN_INTO_STORE_ERROR)[0];
            expect(action.payload.message).toBe(expectedMessage);
          });
      });
    });

    context('when store request returns a valid macaroon', () => {
      let root;

      beforeEach(() => {
        root = new MacaroonsBuilder('location', 'key', 'id')
          .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
          .getMacaroon();
        storeApi.post('/acl/', (body) => {
          if (!tmatch(body, {
            permissions: ['package_upload_request', 'edit_account'],
            channels: ['edge'],
          })) {
            return false;
          }
          const expectedLifetime = conf.get(
            'STORE_PACKAGE_UPLOAD_REQUEST_LIFETIME'
          );
          const now = moment();
          const expires = moment(body.expires);
          return expires.isBetween(
            // Allow a bit of slack for slow tests.
            now.clone().add(expectedLifetime - 5, 'seconds'),
            // Add a millisecond to cope with isBetween using exclusive
            // bounds.
            now.clone().add(expectedLifetime * 1000 + 1, 'milliseconds'));
        })
          .reply(200, { macaroon: root.serialize() });
      });

      it('stores the macaroon in local storage', () => {
        const location = {};
        return store.dispatch(signIntoStore(location))
          .then(() => {
            expect(localForageStub.store.package_upload_request).toEqual({
              root: root.serialize()
            });
          });
      });

      it('redirects to /login/authenticate', () => {
        const startingUrl = `${conf.get('BASE_URL')}/dashboard`;
        const location = { href: startingUrl };
        return store.dispatch(signIntoStore(location))
          .then(() => {
            expect(url.parse(location.href, true)).toMatch({
              path: '/login/authenticate',
              query: {
                starting_url: startingUrl,
                caveat_id: 'sso caveat'
              }
            });
          });
      });
    });
  });

  context('checkSignedIntoStore', () => {
    afterEach(() => {
      localForageStub.clear();
    });

    context('when local storage throws an error', () => {
      beforeEach(() => {
        localForageStub.store['package_upload_request'] = new Error(
          'Something went wrong!'
        );
      });

      it('stores an error', () => {
        const expectedMessage = 'Something went wrong!';

        return store.dispatch(checkSignedIntoStore())
          .then(() => {
            const action = store.getActions().filter(
              (a) => a.type === ActionTypes.CHECK_SIGNED_INTO_STORE_ERROR)[0];
            expect(action.payload.message).toBe(expectedMessage);
          });
      });
    });

    context('when local storage does not contain root macaroon', () => {
      it('stores unauthenticated status', () => {
        const expectedAction = {
          type: ActionTypes.CHECK_SIGNED_INTO_STORE_SUCCESS,
          payload: false
        };

        return store.dispatch(checkSignedIntoStore())
          .then(() => expect(store.getActions()).toInclude(expectedAction));
      });
    });

    context('when local storage contains mismatching macaroons', () => {
      beforeEach(() => {
        const root = new MacaroonsBuilder('location', 'key', 'id')
          .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
          .getMacaroon();
        const discharge = MacaroonsBuilder.create(
          ssoLocation, 'wrong', 'wrong'
        );
        localForageStub.store['package_upload_request'] = {
          root: root.serialize(),
          discharge: discharge.serialize()
        };
      });

      it('stores unauthenticated status', () => {
        const expectedAction = {
          type: ActionTypes.CHECK_SIGNED_INTO_STORE_SUCCESS,
          payload: false
        };

        return store.dispatch(checkSignedIntoStore())
          .then(() => expect(store.getActions()).toInclude(expectedAction));
      });
    });

    context('when local storage contains matching macaroons', () => {
      beforeEach(() => {
        const root = new MacaroonsBuilder('location', 'key', 'id')
          .add_third_party_caveat(ssoLocation, 'sso key', 'sso caveat')
          .getMacaroon();
        const discharge = MacaroonsBuilder.create(
          ssoLocation, 'sso key', 'sso caveat'
        );
        localForageStub.store['package_upload_request'] = {
          root: root.serialize(),
          discharge: discharge.serialize()
        };
      });

      it('stores authenticated status', () => {
        const expectedAction = {
          type: ActionTypes.CHECK_SIGNED_INTO_STORE_SUCCESS,
          payload: true
        };

        return store.dispatch(checkSignedIntoStore())
          .then(() => expect(store.getActions()).toInclude(expectedAction));
      });
    });
  });

  context('getAccountInfo', () => {
    let api;
    let root;
    let discharge;

    beforeEach(() => {
      api = nock(`${conf.get('BASE_URL')}/api`);
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

    it('stores a GET_ACCOUNT_INFO action', () => {
      const expectedAction = { type: ActionTypes.GET_ACCOUNT_INFO };
      return store.dispatch(getAccountInfo('test-user'))
        .then(() => {
          expect(store.getActions()).toInclude(expectedAction);
          api.done();
        });
    });

    it('stores an error if there is no package upload request ' +
       'macaroon', () => {
      return store.dispatch(getAccountInfo('test-user'))
        .then(() => {
          const action = store.getActions().filter(
            (a) => a.type === ActionTypes.GET_ACCOUNT_INFO_ERROR)[0];
          expect(action.payload.json.payload).toEqual({
            code: 'not-logged-into-store',
            message: 'Not logged into store',
            detail: 'No package_upload_request macaroons in local storage'
          });
          api.done();
        });
    });

    context('if there is an package upload request macaroon', () => {
      const accountAssertionsDisabledError = {
        code: 'feature-disabled',
        message: 'The account assertions are currently disabled.'
      };
      const unsignedAgreementError = {
        code: 'user-not-ready',
        message: 'Developer has not signed agreement.'
      };
      const missingShortNamespaceError = {
        code: 'user-not-ready',
        message: 'Developer profile is missing short namespace.'
      };
      const shortNamespaceInUseError = {
        code: 'conflict',
        message: 'The supplied short namespace is already in use.'
      };

      beforeEach(() => {
        localForageStub.store['package_upload_request'] = { root, discharge };
      });

      it('stores an error on failure to get account information', () => {
        api.get('/store/account')
          .query(true)
          .reply(501, { error_list: [accountAssertionsDisabledError] });
        return store.dispatch(getAccountInfo('test-user'))
          .then(() => {
            const action = store.getActions().filter(
              (a) => a.type === ActionTypes.GET_ACCOUNT_INFO_ERROR)[0];
            expect(action.payload.json.payload).toEqual(
              accountAssertionsDisabledError
            );
            api.done();
          });
      });

      it('stores success action if getting account information succeeds ' +
         'and returns a short namespace', () => {
        api.get('/store/account')
          .query(true)
          .reply(200, {});
        const expectedAction = {
          type: ActionTypes.GET_ACCOUNT_INFO_SUCCESS,
          payload: { signedAgreement: true, hasShortNamespace: true }
        };
        return store.dispatch(getAccountInfo('test-user'))
          .then(() => {
            expect(store.getActions()).toInclude(expectedAction);
            api.done();
          });
      });

      it('stores success action if getting account information fails ' +
         'because of an unsigned agreement', () => {
        api.get('/store/account')
          .query(true)
          .reply(403, { error_list: [unsignedAgreementError] });
        const expectedAction = {
          type: ActionTypes.GET_ACCOUNT_INFO_SUCCESS,
          payload: { signedAgreement: false, hasShortNamespace: null }
        };
        return store.dispatch(getAccountInfo('test-user'))
          .then(() => {
            expect(store.getActions()).toInclude(expectedAction);
            api.done();
          });
      });

      context('if getting account information fails because of a missing ' +
              'short namespace', () => {
        beforeEach(() => {
          api.get('/store/account')
            .query(true)
            .reply(403, { error_list: [missingShortNamespaceError] });
        });

        it('stores an error on failure to set the short namespace', () => {
          api.patch('/store/account', { short_namespace: 'test-user' })
            .reply(409, { error_list: [shortNamespaceInUseError] });
          return store.dispatch(getAccountInfo('test-user'))
            .then(() => {
              const action = store.getActions().filter(
                (a) => a.type === ActionTypes.GET_ACCOUNT_INFO_ERROR)[0];
              expect(action.payload.json.payload).toEqual(
                shortNamespaceInUseError
              );
              api.done();
            });
        });

        it('stores success action if setting the short namespace fails ' +
           'because of an unsigned agreement', () => {
          api.patch('/store/account', { short_namespace: 'test-user' })
            .reply(403, { error_list: [unsignedAgreementError] });
          const expectedAction = {
            type: ActionTypes.GET_ACCOUNT_INFO_SUCCESS,
            payload: { signedAgreement: false, hasShortNamespace: false }
          };
          return store.dispatch(getAccountInfo('test-user'))
            .then(() => {
              expect(store.getActions()).toInclude(expectedAction);
              api.done();
            });
        });

        context('if setting the short namespace succeeds', () => {
          beforeEach(() => {
            api.patch('/store/account')
              .reply(204);
          });

          it('stores an error if getting account information fails', () => {
            api.get('/store/account')
              .query(true)
              .reply(501, { error_list: [accountAssertionsDisabledError] });
            return store.dispatch(getAccountInfo('test-user'))
              .then(() => {
                const action = store.getActions().filter(
                  (a) => a.type === ActionTypes.GET_ACCOUNT_INFO_ERROR)[0];
                expect(action.payload.json.payload).toEqual(
                  accountAssertionsDisabledError
                );
                api.done();
              });
          });

          it('stores success action if getting account information ' +
             'succeeds', () => {
            api.get('/store/account')
              .query(true)
              .reply(200, {});
            const expectedAction = {
              type: ActionTypes.GET_ACCOUNT_INFO_SUCCESS,
              payload: { signedAgreement: true, hasShortNamespace: true }
            };
            return store.dispatch(getAccountInfo('test-user'))
              .then(() => {
                expect(store.getActions()).toInclude(expectedAction);
                api.done();
              });
          });

          it('stores success action if getting account information fails ' +
             'because of an unsigned agreement', () => {
            api.get('/store/account')
              .query(true)
              .reply(403, { error_list: [unsignedAgreementError] });
            const expectedAction = {
              type: ActionTypes.GET_ACCOUNT_INFO_SUCCESS,
              payload: { signedAgreement: false, hasShortNamespace: true }
            };
            return store.dispatch(getAccountInfo('test-user'))
              .then(() => {
                expect(store.getActions()).toInclude(expectedAction);
                api.done();
              });
          });
        });
      });
    });
  });

  context('signAgreementSuccess', () => {
    it('creates an action to store success', () => {
      store.dispatch(signAgreementSuccess());
      expect(store.getActions()).toHaveActionOfType(
        ActionTypes.SIGN_AGREEMENT_SUCCESS
      );
    });
  });

  context('signOut', () => {
    afterEach(() => {
      localForageStub.clear();
    });

    context('when local storage throws an error', () => {
      beforeEach(() => {
        localForageStub.store['package_upload_request'] = new Error(
          'Something went wrong!'
        );
      });

      it('stores an error', () => {
        const expectedMessage = 'Something went wrong!';

        const location = {};
        return store.dispatch(signOut(location))
          .then(() => {
            const action = store.getActions().filter(
              (a) => a.type === ActionTypes.SIGN_OUT_OF_STORE_ERROR)[0];
            expect(action.payload.message).toBe(expectedMessage);
          });
      });

      it('does not redirect', () => {
        const location = {};
        return store.dispatch(signOut(location))
          .then(() => {
            expect(location).toExcludeKey('href');
          });
      });
    });

    context('when local storage succeeds', () => {
      beforeEach(() => {
        localForageStub.store['package_upload_request'] = 'dummy';
      });

      it('removes the item', () => {
        const location = {};
        return store.dispatch(signOut(location))
          .then(() => {
            expect(localForageStub.store).toExcludeKey(
              'package_upload_request'
            );
          });
      });

      it('redirects to /auth/logout', () => {
        const location = {};
        return store.dispatch(signOut(location))
          .then(() => {
            expect(url.parse(location.href, true)).toMatch({
              path: '/auth/logout'
            });
          });
      });
    });
  });
});
