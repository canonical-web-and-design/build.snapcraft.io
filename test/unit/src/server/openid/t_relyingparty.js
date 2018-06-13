import expect from 'expect';
import path from 'path';

import { conf } from '../../../../../src/server/helpers/config';
import {
  saveAssociation,
  loadAssociation,
  removeAssociation
} from '../../../../../src/server/openid/relyingparty';
import { requireWithMockConfigHelper } from '../../../../helpers';

const VERIFY_URL = conf.get('OPENID_VERIFY_URL');
const BASE_URL = conf.get('BASE_URL');
const requireWithMockConfig = requireWithMockConfigHelper.bind(
  null,
  path.resolve(__dirname, '../../../../../src/server/openid/relyingparty'),
  '../helpers/config'
);

describe('RelyingParty', () => {
  let rp;

  before(() => {
    const RelyingPartyFactory = require('../../../../../src/server/openid/relyingparty').default;
    rp = RelyingPartyFactory({}, VERIFY_URL);
  });

  it('should set verify url from config', () => {
    expect(rp.returnUrl).toBe(VERIFY_URL);
  });

  it('should set realm from config', () => {
    expect(rp.realm).toBe(BASE_URL);
  });

  it('should not use stateless verification', () => {
    expect(rp.stateless).toBe(false);
  });

  it('should not use strict mode', () => {
    expect(rp.strict).toBe(false);
  });
});

describe('RelyingParty default extensions', () => {
  let rp;

  before(() => {
    const RelyingPartyFactory = requireWithMockConfig({ OPENID_TEAMS: null }).default;
    rp = RelyingPartyFactory({}, VERIFY_URL);
  });

  it('should not include teams extension if no teams set in config', () => {
    expect(rp.extensions.find((x) => {
      return x.requestParams['openid.ns.lp'] === 'http://ns.launchpad.net/2007/openid-teams';
    })).toNotExist();
  });
});

describe('RelyingParty with teams extension', () => {
  let rp;

  before(() => {
    const RelyingPartyFactory = requireWithMockConfig({
      OPENID_TEAMS: '["test1", "test2"]'
    }).default;

    rp = RelyingPartyFactory({}, VERIFY_URL);
  });

  it('should add teams extension if teams set in config', () => {
    expect(rp.extensions.find((x) => {
      return (
        x.requestParams['openid.ns.lp'] === 'http://ns.launchpad.net/2007/openid-teams' &&
        x.requestParams['openid.lp.query_membership'] === 'test1,test2');
    })).toExist();
  });
});

describe('RelyingParty saveAssociation', () => {

  let mySaveAssociation;
  let mySession = {
    save: (callback) => { callback(); }
  };

  before(() => {
    mySaveAssociation = saveAssociation(mySession);
  });

  it('should return a function', () => {
    expect(mySaveAssociation).toBeA(Function);
  });

  describe('session association', () => {
    let provider = 'foo';
    let type = 'bar';
    let handle = 'baz';
    let secret = 'qux';


    before(() => {
      mySaveAssociation(provider, type, handle, secret, 1, () => {});
    });

    it('should exist on session', () => {
      expect(mySession.association).toEqual({
        provider,
        type,
        secret
      });
    });
  });
});

describe('RelyingParty loadAssociation', () => {

  let myLoadAssociation;
  let mySession = {
    association: 'foo',
    reload: (callback) => { callback(); }
  };
  let spy;

  before(() => {
    myLoadAssociation = loadAssociation(mySession);
    spy = expect.createSpy();
  });

  it('should return a function', () => {
    expect(myLoadAssociation).toBeA(Function);
  });

  describe('session association', () => {
    before(() => {
      myLoadAssociation(null, spy);
    });

    it('should callback with session association', () => {
      expect(spy).toHaveBeenCalledWith(undefined, 'foo');
    });
  });
});

describe('RelyingParty removeAssociation', () => {
  let myRemoveAssociation;
  let mySession = {
    association: 'foo'
  };

  before(() => {
    myRemoveAssociation = removeAssociation(mySession);
  });

  it('should return a function', () => {
    expect(myRemoveAssociation).toBeA(Function);
  });

  it('should delete session association', () => {
    myRemoveAssociation();
    expect(mySession.association).toBe(undefined);
  });
});
