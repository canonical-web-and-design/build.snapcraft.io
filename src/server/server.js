import Express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import url from 'url';
import path from 'path';
import promBundle from 'express-prom-bundle';
import expressWinston from 'express-winston';
import raven from 'raven';
import favicon from 'serve-favicon';

import * as routes from './routes/';
import { conf } from './helpers/config';
import sessionConfig from './helpers/session';
import logging from './logging';
import setRevisionHeader from './middleware/set-revision-header';
import trustedNetworks from './middleware/trusted-networks';

const appUrl = url.parse(conf.get('BASE_URL'));
const app = Express();
const accessLogger = logging.getLogger('express-access');
const logger = logging.getLogger('express');

app.set('logger', logger);
app.use(favicon(path.join(__dirname, '../../src/common/images', 'favicon.ico')));

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
}
// FIXME sstewart 07-Nov-2016 simplify config for host and port
app.locals.host = conf.get('HOST') || appUrl.hostname;
app.locals.port = conf.get('PORT') || appUrl.port;

// middleware
app.use(setRevisionHeader);
app.use(raven.middleware.express.requestHandler(conf.get('SENTRY_DSN')));
app.use(expressWinston.logger({
  winstonInstance: accessLogger,
  level: 'info',
  requestFilter: (req, propName) => {
    if (propName === 'headers') {
      const filteredHeaders = { ...req[propName] };
      delete filteredHeaders.cookie;
      return filteredHeaders;
    }
    return req[propName];
  }
}));
app.use(helmet());
app.use(session(sessionConfig(conf)));
app.use(Express.static(__dirname + '/../public', { maxAge: '365d' }));
const metricsBundle = promBundle({ autoregister: false });
app.use(metricsBundle);

// routes
app.use('/metrics', trustedNetworks, metricsBundle.metricsMiddleware);
app.use('/', routes.login);
app.use('/api', routes.github);
app.use('/api', routes.launchpad);
app.use('/api', routes.store);
app.use('/', routes.webhook);
app.use(routes.login);
app.use(routes.githubAuth);
app.use('/', routes.universal);

// FIXME sstewart 18-Nov-16 won't ever log because of
// https://github.com/canonical-ols/javan-rhino/issues/210
app.use(raven.middleware.express.errorHandler(conf.get('SENTRY_DSN')));
app.use(expressWinston.errorLogger({
  winstonInstance: logger,
  level: 'error'
}));

export { app as default };
