import request from 'request';
import logging from '../logging';

import { GitHubUser } from '../db/models/github-user';
import { conf } from '../helpers/config';
import { requestUser } from './github';

const AUTH_SCOPE = 'admin:repo_hook'; // another scope (like 'public_repo') may be needed to list organisations' repositories
const GITHUB_AUTH_LOGIN_URL = conf.get('GITHUB_AUTH_LOGIN_URL');
const GITHUB_AUTH_VERIFY_URL = conf.get('GITHUB_AUTH_VERIFY_URL');
const GITHUB_AUTH_CLIENT_ID = conf.get('GITHUB_AUTH_CLIENT_ID');
const GITHUB_AUTH_CLIENT_SECRET = conf.get('GITHUB_AUTH_CLIENT_SECRET');
const GITHUB_AUTH_REDIRECT_URL = conf.get('GITHUB_AUTH_REDIRECT_URL');
const HTTP_PROXY = conf.get('HTTP_PROXY');
const logger = logging.getLogger('login');

export const authenticate = (req, res, next) => {
  // Generate unguessable shared secret
  require('crypto').randomBytes(48, function(err, buffer) {
    if (err) {
      next(new Error('Generation of random shared secret failed'));
    }

    req.session.sharedSecret = buffer.toString('hex');

    // Redirect user to GitHub login
    res.redirect(`${GITHUB_AUTH_LOGIN_URL}?` + [
      `client_id=${GITHUB_AUTH_CLIENT_ID}`,
      `redirect_uri=${GITHUB_AUTH_REDIRECT_URL}`,
      `scope=${AUTH_SCOPE}`,
      `state=${req.session.sharedSecret}`,
      'allow_signup=true'
    ].join('&'));
  });
};

export const verify = (req, res, next) => {
  // Check shared secret matches our copy
  if (req.query.state !== req.session.sharedSecret) {
    // Warn about potential CSRF attack
    return next(new Error('Returned shared secret does not match generated shared secret'));
  }

  const options = {
    url: GITHUB_AUTH_VERIFY_URL,
    json: {
      client_id: GITHUB_AUTH_CLIENT_ID,
      client_secret: GITHUB_AUTH_CLIENT_SECRET,
      code: req.query.code,
      redirect_uri: GITHUB_AUTH_REDIRECT_URL,
      state: req.session.sharedSecret
    },
    proxy: HTTP_PROXY
  };

  // Exchange code for token
  request.post(options, async (error, response, body) => {
    // XXX bartaz
    // it seems that we get 200 response with error in body
    // https://developer.github.com/v3/oauth/#common-errors-for-the-access-token-request
    if (error || response.statusCode !== 200 || (body && body.error)) {
      return next(new Error(`Authentication token exchange failed. ${(body && body.error_message) || ''}`));
    }

    logger.info('User successfully authenticated');
    const userResponse = await requestUser(body.access_token);
    if (userResponse.statusCode !== 200) {
      return next(new Error(
        `Authentication failed. ${userResponse.body.message}`
      ));
    }

    logger.info('User info successfully fetched');

    // Save auth token and user info to session
    req.session.githubAuthenticated = true;
    req.session.token = body.access_token;
    req.session.user = userResponse.body;

    // Save user info to DB
    try {
      let dbUser = await GitHubUser.where({ github_id: userResponse.body.id })
        .fetch();
      if (dbUser === null) {
        dbUser = GitHubUser.forge({ github_id: userResponse.body.id });
      }
      await dbUser.set({
        name: userResponse.body.name || null,
        login: userResponse.body.login,
        last_login_at: new Date()
      });
      if (dbUser.hasChanged()) {
        await dbUser.save();
      }
    } catch (error) {
      return next(error);
    }

    // Redirect to logged in URL
    res.redirect('/dashboard');
  });
};

export const errorHandler = (error, req, res, next) => {
  let errMsg = 'Authentication with GitHub failed. Please try again later.';

  if (error && error.message) {
    errMsg = error.message;
  }

  req.session.error = errMsg;
  res.redirect(302, '/login/failed');
  next();
};

export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(new Error('Failed to log out.'));
    }
    // FIXME redirect to page that initiated the sign in request
    res.redirect('/');
  });
};
