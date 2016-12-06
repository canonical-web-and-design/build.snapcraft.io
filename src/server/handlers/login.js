import { conf } from '../helpers/config';
import RelyingPartyFactory from '../openid/relyingparty';
import constants from '../constants';

const OPENID_IDENTIFIER = conf.get('UBUNTU_SSO_URL');
const OPENID_TEAMS = conf.get('OPENID_TEAMS');

export const authenticate = (req, res, next) => {
  const rp = RelyingPartyFactory(req.session);

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

export const verify = (req, res, next) => {
  const rp = RelyingPartyFactory(req.session);

  rp.verifyAssertion(req, (error, result) => {
    if (error) {
      // TODO log errors to sentry
      return next(error);
    }

    if (!result.authenticated) {
      return next(new Error(`${constants.E_SSO_FAIL}`));
    }

    if (OPENID_TEAMS &&
        (!result.teams || !result.teams.some(team => {
          return OPENID_TEAMS.indexOf(team) != -1;
        }))) {
      return next(new Error(`${constants.E_UNAUTHORIZED}`));
    }

    if (!req.session) {
      return next(new Error(`${constants.E_NO_SESSION}`));
    }

    req.session.authenticated = result.authenticated;
    req.session.name = result.fullname;
    req.session.email = result.email;
    // FIXME redirect to page that initiated the sign in request
    res.redirect('/');
  });
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
