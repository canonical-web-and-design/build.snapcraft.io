import request from 'request';
import logging from '../logging';

const AUTH_SCOPE = 'admin:repo_hook';
const logger = logging.getLogger('login');

export const authenticate = (conf) => {
  return (req, res) => {
    // Generate unguessable shared secret
    require('crypto').randomBytes(48, function(err, buffer) {
      req.session.sharedSecret = buffer.toString('hex');

      // Redirect user to GitHub login
      res.redirect(conf.get('GITHUB_AUTH_LOGIN_URL') + '?' + [
        'client_id=' + conf.get('GITHUB_AUTH_CLIENT_ID'),
        'redirect_uri=' + conf.get('GITHUB_AUTH_REDIRECT_URL'),
        'scope=' + AUTH_SCOPE,
        'state=' + req.session.sharedSecret,
        'allow_signup=true'
      ].join('&'));
    });
  };
};

export const verify = (conf) => {
  return (req, res, next) => {
    // Check shared secret matches our copy
    if (req.query.state !== req.session.sharedSecret) {
      // Warn about potential CSRF attack
      logger.info('Authentication shared secret mismatch');
      return next(new Error('Returned shared secret does not match generated shared secret'));
    }

    let options = {
      url: conf.get('GITHUB_AUTH_VERIFY_URL'),
      json: {
        client_id: conf.get('GITHUB_AUTH_CLIENT_ID'),
        client_secret: conf.get('GITHUB_AUTH_CLIENT_SECRET'),
        code: req.query.code,
        redirect_uri: conf.get('GITHUB_AUTH_REDIRECT_URL'),
        state: req.session.sharedSecret
      }
    };
    // Exchange code for token
    request.post(options, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        logger.info('Authentication token exchange failed', error);
        return next(new Error('Authentication token exchange failed'));
      }

      // Save auth token to session
      req.session.token = body.access_token;
      logger.info('User successfully authenticated');

      // Redirect to logged in URL
      res.redirect('/');
    });
  };
};
