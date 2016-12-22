const logging = require('../logging/').default;
const logger = logging.getLogger('express');

export const notify = (req, res) => {
  // Acknowledge webhook
  res.status(200).send();

  logger.debug('Received webhook: ', req.body);
};
