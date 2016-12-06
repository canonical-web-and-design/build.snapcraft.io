import expect from 'expect';
import { Teams, Macaroons } from '../../../../../src/server/openid/extensions.js';

describe('Teams', () => {
  it('should have lp namespace', () => {
    const teams = new Teams();

    expect(teams.requestParams).toEqual({
      'openid.ns.lp': 'http://ns.launchpad.net/2007/openid-teams'
    });
  });

  it('should should query team membership', () => {
    const myTeams = ['foo', 'bar'];
    const teams = new Teams(myTeams);

    expect(teams.requestParams).toEqual({
      'openid.ns.lp': 'http://ns.launchpad.net/2007/openid-teams',
      'openid.lp.query_membership': myTeams.join(',')
    });
  });

  it('should fill result with queried teams', () => {
    const myTeams = ['foo', 'bar'];
    const teams = new Teams(myTeams);
    const params = {
      'openid.lp.is_member': myTeams.join(',')
    };
    const result = {};

    teams.fillResult(params, result);

    expect(result).toEqual({ teams: myTeams });
  });
});

describe('Macaroons', () => {
  it('should have the sso macaroon namespace', () => {
    const macaroons = new Macaroons();

    expect(macaroons.requestParams).toEqual({
      'openid.ns.macaroon': 'http://ns.login.ubuntu.com/2016/openid-macaroon'
    });
  });

  it('should send caveat id', () => {
    const cid = 'foo';
    const macaroons = new Macaroons(cid);

    expect(macaroons.requestParams).toEqual({
      'openid.ns.macaroon': 'http://ns.login.ubuntu.com/2016/openid-macaroon',
      'openid.macaroon.caveat_id': cid
    });
  });

  it('should fill result caveat id', () => {
    const cid = 'foo';
    const macaroons = new Macaroons(cid);
    const params = {
      'openid.macaroon.discharge': cid
    };
    const result = {};

    macaroons.fillResult(params, result);

    expect(result).toEqual({ discharge: cid });
  });
});
