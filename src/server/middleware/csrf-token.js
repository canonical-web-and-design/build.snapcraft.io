import uuid from 'uuid';

export const generateToken = (req, res, next) => {
  // Don't generate new tokens for API calls, if there is no session,
  // if user is not logged in, or if there is a token already
  if (req.path.match(/^\/api/) || !req.session || !req.session.user || req.session.csrfToken) {
    return next();
  }

  req.session.csrfToken = uuid.v4();
  next();
};

export const verifyToken = (req, res, next) => {
  const csrfToken = req.get('X-CSRF-Token');

  if (!csrfToken) {
    return res.status(401).json(RESPONSE_MISSING_TOKEN);
  }

  if (!req.session.csrfToken) {
    return res.status(401).json(RESPONSE_SESSION_HAS_NO_TOKENS);
  }

  if (req.session.csrfToken !== csrfToken) {
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
