require('css-modules-require-hook/preset');
require('images-require-hook')('.svg', '/static/icons');

const app = require('./server').default;
const logger = app.get('logger');

const server = app.listen(app.locals.port, app.locals.host, () => {
  const host = server.address().address;
  const port = server.address().port;

  logger.info('Express server listening on http://%s:%s', host, port);
});
