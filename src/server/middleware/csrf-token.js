import uuid from 'uuid';

export const generateToken = (req, res, next) => {
  // Don't generate new tokens for API calls or if there is no session
  if (req.path.match(/^\/api/) || !req.session) {
    return next();
  }

  const csrfToken = uuid.v4();
  if (typeof req.session.csrfTokens === 'undefined') {
    req.session.csrfTokens = [];
  }

  req.session.csrfTokens.push(csrfToken);

  // 100 valid CSRF tokens at a time
  // (so multiple tabs/requests can be handled at the same time)
  while (req.session.csrfTokens.length > 100) {
    req.session.csrfTokens.shift();
  }

  next();
};

export const verifyToken = (req, res, next) => {
  const csrfToken = req.get('X-CSRF-Token');

  if (!csrfToken) {
    return res.status(401).json(RESPONSE_MISSING_TOKEN);
  }

  if (!req.session.csrfTokens) {
    req.session.csrfTokens = [];

    return res.status(401).json(RESPONSE_SESSION_HAS_NO_TOKENS);
  }

  if (req.session.csrfTokens.indexOf(csrfToken) == -1) {
    return res.status(401).json(RESPONSE_INVALID_TOKEN);
  }

  next();
};

const RESPONSE_SESSION_HAS_NO_TOKENS = {
  status: 'error',
  body: {
    code: 'session-has-no-tokens',
    message: 'No valid CSRF tokens found in session'
  }
};

const RESPONSE_MISSING_TOKEN = {
  status: 'error',
  body: {
    code: 'request-missing-token',
    message: 'No CSRF token header sent'
  }
};

const RESPONSE_INVALID_TOKEN = {
  status: 'error',
  body: {
    code: 'token-not-valid',
    message: 'CSRF token not valid'
  }
};
