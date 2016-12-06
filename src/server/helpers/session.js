import session from 'express-session';
import ConnectMemcached from 'connect-memcached';
import logging from '../logging/';

const logger = logging.getLogger('session');

const MemcachedStore = ConnectMemcached(session);
const SESSION_DEFAULTS = {
  name : 'sessionId',
  cookie: {
    maxAge: 2 * 60 * 60 * 1000, // 2 hours, macaroon life span
  },
  resave: false,
  saveUninitialized: false
};

export default function sessionStorageConfig(config) {
  let settings = { ...SESSION_DEFAULTS };

  if (config.get('COOKIE_SECURE')) {
    settings.cookie.secure = true;
  }

  if(config.get('SESSION_SECRET')) {
    logger.info('Starting with configured session secret');
    settings.secret = config.get('SESSION_SECRET');
  } else {
    if(process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to start without SESSION_SECRET environment variable');
    }

    logger.info('Starting with development default session secret');
    settings.secret = 'dont-use-me-in-production';
  }

  if(config.get('SESSION_MEMCACHED_HOST') && config.get('SESSION_MEMCACHED_SECRET')) {
    logger.info('Starting with memcached session store');
    settings.store = new MemcachedStore({
      hosts: config.get('SESSION_MEMCACHED_HOST').split(','),
      secret: config.get('SESSION_MEMCACHED_SECRET')
    });
  } else {
    // TODO: Log memory session store
  }

  return settings;
}
