import uuid from 'node-uuid';

export const generateToken = (req, res, next) => {
  // Don't generate new tokens for API calls
  if (req.path.match(/^\/api/)) {
    return next();
  }

  // TODO: Remove debug
  const csrfToken = uuid.v4();
  if (typeof req.session.csrfTokens === 'undefined') {
    req.session.csrfTokens = [];
  }

  req.session.csrfTokens.push(csrfToken);

  // Only 5 valid CSRF tokens at a time. Safe to increase number.
  while (req.session.csrfTokens.length > 5) {
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
