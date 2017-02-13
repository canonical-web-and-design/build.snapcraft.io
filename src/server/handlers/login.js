import qs from 'qs';

import { conf } from '../helpers/config';
import RelyingPartyFactory from '../openid/relyingparty';
import constants from '../constants';
import { completeSnapAuthorization } from '../handlers/launchpad';

const OPENID_IDENTIFIER = conf.get('UBUNTU_SSO_URL');
const OPENID_VERIFY_URL = conf.get('OPENID_VERIFY_URL');

const makeRelyingParty = (req) => {
  // We must make sure to generate the exact same return URL in both
  // authenticate and verify, including query string ordering.
  let returnUrl = OPENID_VERIFY_URL;
  const query = qs.stringify(req.query, {
    filter: ['starting_url', 'caveat_id', 'repository_url']
  });
  if (query.length) {
    returnUrl += '?' + query;
  }
  // Pass any caveat ID separately as well, since RelyingPartyFactory needs
  // it in order to decide whether to use the Macaroon extension.
  return RelyingPartyFactory(req.session, returnUrl, req.query.caveat_id);
};

export const authenticate = (req, res, next) => {
  const rp = makeRelyingParty(req);

  // TODO log errors to sentry
  rp.authenticate(OPENID_IDENTIFIER, false, (error, authUrl) => {
    if (error) {
      return next(new Error(`${constants.E_AUTHENTICATION_FAIL}: ${error.message}`));
    }
    else if (!authUrl) {
      return next(new Error(constants.E_AUTHENTICATION_FAIL));
    }
    else {
      res.redirect(authUrl);
    }
  });

};

export const processVerifiedAssertion = (req, res, next, error, result) => {
  const OPENID_TEAMS = conf.get('OPENID_TEAMS');

  if (error) {
    // TODO log errors to sentry
    return next(error);
  }

  if (!result.authenticated) {
    return next(new Error(`${constants.E_SSO_FAIL}`));
  }

  if (!req.session) {
    return next(new Error(`${constants.E_NO_SESSION}`));
  }

  if (OPENID_TEAMS &&
      (!result.teams || !result.teams.some(team => {
        return OPENID_TEAMS.indexOf(team) != -1;
      }))) {

    return next(new Error(`${constants.E_UNAUTHORIZED}`));
  }

  req.session.authenticated = result.authenticated;
  req.session.name = result.fullname;
  req.session.email = result.email;
  let completeAuth;
  if (req.query.repository_url && result.discharge) {
    // Old-style authorization of a single snap.
    completeAuth = completeSnapAuthorization(
        req.session, req.query.repository_url, result.discharge);
  } else {
    if (result.discharge) {
      // New-style authorization of a package_upload_request macaroon.
      // Temporarily stash the discharge macaroon in the session.  The
      // client will pick this up later and move it to local storage.
      req.session.ssoDischarge = result.discharge;
    }
    // We have no further authorization work to do, but a dummy promise is
    // handy to avoid duplicating code.
    completeAuth = Promise.resolve(null);
  }
  return completeAuth
    .then(() => {
      res.redirect(req.query.starting_url || '/');
    })
    .catch((error) => next(new Error(error.body.payload.message)));
};

export const verify = (req, res, next) => {
  const rp = makeRelyingParty(req);

  rp.verifyAssertion(req, (error, result) => {
    return processVerifiedAssertion(req, res, next, error, result);
  });
};

export const getSSODischarge = (req, res) => {
  if (req.session && req.session.ssoDischarge) {
    return res.status(200).send({
      status: 'success',
      payload: {
        code: 'discharge-found',
        discharge: req.session.ssoDischarge
      }
    });
  } else {
    return res.status(404).send({
      status: 'error',
      payload: {
        code: 'discharge-not-found',
        message: 'No SSO discharge macaroon stored'
      }
    });
  }
};

export const deleteSSODischarge = (req, res) => {
  if (req.session) {
    delete req.session.ssoDischarge;
  }
  return res.status(204).end();
};

export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      // TODO log errors to sentry
      return next(new Error(constants.E_LOGOUT_FAIL));
    }
    // FIXME redirect to page that initiated the sign in request
    res.redirect('/');
  });
};

export const errorHandler = (err, req, res, next) => {
  // https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
  if (res.headersSent) {
    return next(err);
  }
  if (req.session) {
    req.session.error = err.message;
    res.redirect('/login/failed');
  } else {
    // FIXME redirect to page that initiated the sign in request
    res.redirect('/');
  }
};
