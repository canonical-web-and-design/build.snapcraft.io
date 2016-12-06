export class Teams {
  constructor(teams) {
    this.requestParams = {
      'openid.ns.lp': 'http://ns.launchpad.net/2007/openid-teams'
    };
    if (teams && teams.length) {
      this.requestParams['openid.lp.query_membership'] = teams.join(',');
    }
  }

  fillResult(params, result) {
    if (params['openid.lp.is_member'] && params['openid.lp.is_member'].length) {
      result['teams'] = params['openid.lp.is_member'].split(',');
    }
  }
}

export class Macaroons {
  constructor(cid) {
    this.requestParams = {
      'openid.ns.macaroon': 'http://ns.login.ubuntu.com/2016/openid-macaroon'
    };
    if (cid) {
      this.requestParams['openid.macaroon.caveat_id'] = cid;
    }
  }

  fillResult(params, result) {
    if (params['openid.macaroon.discharge']) {
      result['discharge'] = params['openid.macaroon.discharge'];
    }
  }
}
