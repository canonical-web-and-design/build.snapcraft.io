import Express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import url from 'url';
import expressWinston from 'express-winston';
import raven from 'raven';

import * as routes from './routes/';
import { conf } from './helpers/config';
import sessionConfig from './helpers/session';
import logging from './logging';
import setRevisionHeader from './middleware/set-revision-header.js';

const appUrl = url.parse(conf.get('BASE_URL'));
const app = Express();
const accessLogger = logging.getLogger('express-access');
const errorLogger = logging.getLogger('express-error');
const logger = logging.getLogger('express');

app.set('logger', logger);

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
  level: 'info'
}));
app.use(helmet());
app.use(session(sessionConfig(conf)));
app.use(Express.static(__dirname + '/../public', { maxAge: '365d' }));

// routes
app.use('/', routes.login);
app.use('/api', routes.github);
app.use('/', routes.universal);

// FIXME sstewart 18-Nov-16 won't ever log because of
// https://github.com/canonical-ols/javan-rhino/issues/210
app.use(raven.middleware.express.errorHandler(conf.get('SENTRY_DSN')));
app.use(expressWinston.errorLogger({
  winstonInstance: errorLogger,
  level: 'info'
}));

export { app as default };
