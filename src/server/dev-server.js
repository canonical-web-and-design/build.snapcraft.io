require('css-modules-require-hook/preset');
const clearRequireCache = require('./helpers/hot-load').clearRequireCache;
const chokidar = require('chokidar');

const conf = require('./helpers/config').conf;
const WEBPACK_DEV_URL = conf.get('SERVER:WEBPACK_DEV_URL') || '';
require('images-require-hook')('.svg', `${WEBPACK_DEV_URL}/static/icons`);

const app = require('./server').default;
const logger = app.get('logger');

const server = app.listen(app.locals.port, app.locals.host, () => {
  const host = server.address().address;
  const port = server.address().port;

  logger.info('Express server listening on http://%s:%s', host, port);
});

// Do "hot-reloading" of express stuff on the server
// Throw away cached modules and re-require next time
// Ensure there's no important state in there!
const watcher = chokidar.watch('./src');

watcher.on('ready', function() {
  watcher.on('all', function() {
    clearRequireCache(/[\/\\]src[\/\\]/, require.cache);
  });
});
